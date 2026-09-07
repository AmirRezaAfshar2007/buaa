import { Router, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.ts';
import type { AuthRequest } from '../types/express.d.ts';
import { requireAuth } from '../middleware/auth.ts';
import { speakingAnalysisLimiter, speakingCaptionLimiter } from '../middleware/rateLimit.ts';
import { AppError } from '../utils/errors.ts';
import * as speakingService from '../services/speaking.service.ts';
import type { SpeakingDifficulty } from '../models/SpeakingAttempt.ts';

const router = Router();
router.use(requireAuth);

const DIFFICULTIES: SpeakingDifficulty[] = ['beginner', 'intermediate', 'advanced'];

function assertValidDifficulty(value: unknown): asserts value is SpeakingDifficulty {
  if (typeof value !== 'string' || !DIFFICULTIES.includes(value as SpeakingDifficulty)) {
    throw new AppError('Invalid difficulty level.', 400);
  }
}

function assertValidAudioPayload(audioBase64: unknown, mimeType: unknown): asserts audioBase64 is string {
  if (typeof audioBase64 !== 'string' || audioBase64.length < 100) {
    throw new AppError('A voice recording is required.', 400);
  }
  if (typeof mimeType !== 'string' || !mimeType.startsWith('audio/')) {
    throw new AppError('Invalid audio format.', 400);
  }
}

router.get(
  '/challenge',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const difficulty = (req.query.difficulty as string) || 'beginner';
    assertValidDifficulty(difficulty);
    const challenge = speakingService.getRandomChallenge(difficulty);
    res.json(challenge);
  })
);

router.post(
  '/analyze',
  speakingAnalysisLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { audioBase64, mimeType, challengePrompt, difficulty, durationSeconds } = req.body ?? {};

    assertValidAudioPayload(audioBase64, mimeType);
    if (typeof challengePrompt !== 'string' || !challengePrompt.trim()) {
      throw new AppError('Missing speaking challenge prompt.', 400);
    }
    assertValidDifficulty(difficulty);
    const duration = Number(durationSeconds) || 0;
    if (duration < 0 || duration > 300) {
      throw new AppError('Recording must be between 0 and 300 seconds.', 400);
    }

    // Reject before touching ffmpeg/the AI at all if today's quota is spent.
    await speakingService.assertUnderDailySpeakingLimit(req.user!.studentId);

    const result = await speakingService.analyzeSpeaking({
      studentId: req.user!.studentId,
      audioBase64,
      mimeType,
      challengePrompt: challengePrompt.trim(),
      difficulty,
      durationSeconds: duration,
    });

    res.status(201).json(result);
  })
);

router.get(
  '/usage',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const usage = await speakingService.getSpeakingUsage(req.user!.studentId);
    res.json(usage);
  })
);

router.post(
  '/transcribe-chunk',
  speakingCaptionLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { audioBase64, mimeType } = req.body ?? {};
    assertValidAudioPayload(audioBase64, mimeType);

    const result = await speakingService.transcribeChunk({ audioBase64, mimeType });
    res.json(result);
  })
);

router.get(
  '/history',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const history = await speakingService.listHistory(req.user!.studentId, limit);
    res.json(history);
  })
);

export default router;

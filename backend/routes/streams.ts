import { Router, Request, Response, NextFunction } from 'express';
import { streamRepository } from '../repositories/streams';
import { insertLiveStreamSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * GET /api/streams - Get all streams with optional status filter
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const streams = await streamRepository.findAll(status, page, limit);
    
    return res.json({
      success: true,
      data: streams,
      metadata: {
        page,
        limit,
        hasMore: streams.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/streams/live - Get currently live streams
 */
router.get('/live', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streams = await streamRepository.getLiveStreams();
    
    return res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/streams/scheduled - Get scheduled streams
 */
router.get('/scheduled', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streams = await streamRepository.getScheduledStreams();
    
    return res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/streams/ended - Get recently ended streams
 */
router.get('/ended', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const streams = await streamRepository.getEndedStreams(limit);
    
    return res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/streams/:id - Get stream by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const stream = await streamRepository.findById(id);
    
    if (!stream) {
      throw new AppError('Stream not found', 404);
    }
    
    return res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/streams - Create new stream (requires authentication)
 */
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as { id: string; email: string; };
    const validatedData = insertLiveStreamSchema.parse(req.body);
    
    const stream = await streamRepository.create({
      ...validatedData,
      creatorId: user.id
    });
    
    return res.status(201).json({
      success: true,
      data: stream
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/streams/:id/status - Update stream status (requires authentication)
 */
router.put('/:id/status', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    if (!['scheduled', 'starting', 'live', 'ending', 'ended', 'error'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    const success = await streamRepository.updateStatus(id, status);
    
    if (!success) {
      throw new AppError('Failed to update stream status', 500);
    }
    
    return res.json({
      success: true,
      data: { message: 'Stream status updated' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/streams/:id/viewers - Update stream viewer count
 */
router.put('/:id/viewers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { viewers } = req.body;
    
    if (typeof viewers !== 'number' || viewers < 0) {
      throw new AppError('Invalid viewer count', 400);
    }
    
    const success = await streamRepository.updateViewers(id, viewers);
    
    if (!success) {
      throw new AppError('Failed to update viewer count', 500);
    }
    
    return res.json({
      success: true,
      data: { message: 'Viewer count updated' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/streams/:id/chat - Get chat messages for a stream
 */
router.get('/:id/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const messages = await streamRepository.getChatMessages(id, limit);
    
    return res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/streams/:id/chat - Add chat message (requires authentication)
 */
router.post('/:id/chat', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { message, type = 'message' } = req.body;
    const user = req.user as { id: string; email: string; };
    
    if (!message || message.trim().length === 0) {
      throw new AppError('Message cannot be empty', 400);
    }
    
    if (!['message', 'system', 'bullet'].includes(type)) {
      throw new AppError('Invalid message type', 400);
    }
    
    const chatMessage = await streamRepository.addChatMessage(id, user.id, message.trim(), type);
    
    return res.status(201).json({
      success: true,
      data: chatMessage
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/streams/creator/:creatorId - Get streams by creator
 */
router.get('/creator/:creatorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.params.creatorId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const streams = await streamRepository.findByCreatorId(creatorId, page, limit);
    
    return res.json({
      success: true,
      data: streams,
      metadata: {
        page,
        limit,
        hasMore: streams.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
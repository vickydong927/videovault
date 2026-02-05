import { Router, Request, Response, NextFunction } from 'express';
import { videoRepository } from '../repositories/videos';
import { insertVideoSchema, searchVideoSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * GET /api/videos - Get all videos with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const videos = await videoRepository.findAll(page, limit);
    
    return res.json({
      success: true,
      data: videos,
      metadata: {
        page,
        limit,
        hasMore: videos.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/popular - Get popular videos
 */
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const videos = await videoRepository.getPopularVideos(limit);
    
    return res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/recent - Get recent videos
 */
router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const videos = await videoRepository.getRecentVideos(limit);
    
    return res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/:id - Get video by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const video = await videoRepository.findById(id);
    
    if (!video) {
      throw new AppError('Video not found', 404);
    }
    
    return res.json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos - Create new video (requires authentication)
 */
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as { id: string; email: string; };
    const validatedData = insertVideoSchema.parse(req.body);
    
    const video = await videoRepository.create({
      ...validatedData,
      creatorId: user.id
    });
    
    return res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/view - Increment video views
 */
router.post('/:id/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const success = await videoRepository.incrementViews(id);
    
    if (!success) {
      throw new AppError('Failed to update views', 500);
    }
    
    return res.json({
      success: true,
      data: { message: 'View count updated' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/:id/like - Like a video
 */
router.post('/:id/like', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const user = req.user as { id: string; email: string; };
    
    const success = await videoRepository.incrementLikes(id, user.id);
    
    if (!success) {
      throw new AppError('Failed to like video', 500);
    }
    
    return res.json({
      success: true,
      data: { message: 'Video liked successfully' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/videos/:id/status - Update video status (requires authentication)
 */
router.put('/:id/status', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    if (!['processing', 'ready', 'failed'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    const success = await videoRepository.updateStatus(id, status);
    
    if (!success) {
      throw new AppError('Failed to update video status', 500);
    }
    
    return res.json({
      success: true,
      data: { message: 'Video status updated' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/videos/creator/:creatorId - Get videos by creator
 */
router.get('/creator/:creatorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.params.creatorId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const videos = await videoRepository.findByCreatorId(creatorId, page, limit);
    
    return res.json({
      success: true,
      data: videos,
      metadata: {
        page,
        limit,
        hasMore: videos.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
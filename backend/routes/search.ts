import { Router, Request, Response, NextFunction } from 'express';
import { videoRepository } from '../repositories/videos';
import { streamRepository } from '../repositories/streams';
import { searchVideoSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/search/videos - Search videos with filters
 */
router.get('/videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const searchParams = searchVideoSchema.parse({
      query: req.query.query,
      category: req.query.category,
      duration: req.query.duration,
      sortBy: req.query.sortBy,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });
    
    const result = await videoRepository.search(searchParams);
    
    return res.json({
      success: true,
      data: result.videos,
      metadata: {
        total: result.total,
        page: searchParams.page,
        limit: searchParams.limit,
        hasMore: (searchParams.page * searchParams.limit) < result.total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/streams - Search live streams
 */
router.get('/streams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, status, category } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // For now, get all streams and filter client-side
    // In production, this would be implemented with proper database search
    let streams = await streamRepository.findAll(status as string, page, limit);
    
    // Simple text search if query provided
    if (query && typeof query === 'string') {
      const searchTerm = query.toLowerCase();
      streams = streams.filter(stream => 
        stream.title.toLowerCase().includes(searchTerm) ||
        stream.description.toLowerCase().includes(searchTerm) ||
        stream.creatorName.toLowerCase().includes(searchTerm) ||
        (Array.isArray(stream.tags) && stream.tags.some((tag: string) => 
          tag.toLowerCase().includes(searchTerm)
        ))
      );
    }
    
    // Category filter
    if (category && typeof category === 'string' && category !== 'all') {
      streams = streams.filter(stream => 
        stream.category.toLowerCase() === category.toLowerCase()
      );
    }
    
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
 * GET /api/search/suggestions - Get search suggestions
 */
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get popular videos for suggestions
    const popularVideos = await videoRepository.getPopularVideos(10);
    const recentVideos = await videoRepository.getRecentVideos(10);
    
    const searchTerm = query.toLowerCase();
    const suggestions = new Set<string>();
    
    // Extract suggestions from video titles and tags
    [...popularVideos, ...recentVideos].forEach(video => {
      // Add matching titles
      if (video.title.toLowerCase().includes(searchTerm)) {
        suggestions.add(video.title);
      }
      
      // Add matching tags
      if (Array.isArray(video.tags)) {
        video.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(searchTerm)) {
            suggestions.add(tag);
          }
        });
      }
      
      // Add matching creator names
      if (video.creatorName.toLowerCase().includes(searchTerm)) {
        suggestions.add(video.creatorName);
      }
    });
    
    // Convert to array and limit results
    const suggestionArray = Array.from(suggestions).slice(0, 8);
    
    return res.json({
      success: true,
      data: suggestionArray
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/categories - Get available categories
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, this would query the database for actual categories
    const categories = [
      'Education',
      'Technology',
      'Business',
      'Creative',
      'Entertainment',
      'Science',
      'Health',
      'Sports',
      'Music',
      'Gaming',
      'News',
      'Documentary',
      'Tutorial',
      'Review',
      'Other'
    ];
    
    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/trending - Get trending content
 */
router.get('/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get popular videos as trending content
    const trendingVideos = await videoRepository.getPopularVideos(limit);
    
    // Get live streams as trending streams
    const liveStreams = await streamRepository.getLiveStreams();
    
    return res.json({
      success: true,
      data: {
        videos: trendingVideos,
        streams: liveStreams.slice(0, 10) // Limit live streams
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
import { useState } from 'react';
import { VideoItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UploadIcon, 
  XIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  FileVideoIcon
} from 'lucide-react';
import { videoService } from '@/lib/video-service';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (video: VideoItem) => void;
}

const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    thumbnailUrl: '',
    videoUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user on component initialization
  if (!currentUser) {
    const userResponse = videoService.getCurrentUser();
    if (userResponse.success) {
      setCurrentUser(userResponse.data);
    }
  }

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
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.thumbnailUrl.trim()) {
      newErrors.thumbnailUrl = 'Thumbnail URL is required';
    }

    if (!selectedFile && !formData.videoUrl.trim()) {
      newErrors.video = 'Please select a video file or provide a video URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulateUpload = async (): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(Math.min(progress, 100));
      }, 200);
    });
  };

  const simulateProcessing = async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Simulate file upload
      await simulateUpload();
      
      setUploadStatus('processing');
      
      // Simulate video processing
      await simulateProcessing();

      // Create video object
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const videoData: Omit<VideoItem, 'id' | 'uploadDate' | 'views' | 'likes'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        videoUrl: formData.videoUrl.trim() || 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: Math.floor(Math.random() * 3600) + 300, // Random duration between 5 minutes and 1 hour
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorAvatar: currentUser.avatar,
        tags: tagsArray,
        category: formData.category,
        status: 'ready'
      };

      const response = videoService.uploadVideo(videoData);
      
      if (response.success) {
        setUploadStatus('completed');
        setTimeout(() => {
          onUploadComplete(response.data);
          handleClose();
        }, 1500);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
  };

  const handleClose = () => {
    if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
      return; // Prevent closing during upload
    }
    
    setFormData({
      title: '',
      description: '',
      category: '',
      tags: '',
      thumbnailUrl: '',
      videoUrl: ''
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrors({});
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, video: '' }));
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <UploadIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading video...';
      case 'processing':
        return 'Processing video...';
      case 'completed':
        return 'Upload completed successfully!';
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return 'Upload Video';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </DialogTitle>
        </DialogHeader>

        {(uploadStatus === 'idle' || (uploadStatus as UploadStatus) === 'error') ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video File Upload */}
            <div className="space-y-2">
              <Label htmlFor="video-file">Video File</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                <input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="video-file" className="cursor-pointer">
                  <FileVideoIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600 mb-1">
                    {selectedFile ? selectedFile.name : 'Click to select video file'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Supports MP4, MOV, AVI, and other video formats
                  </p>
                </label>
              </div>
              {errors.video && (
                <p className="text-sm text-red-600">{errors.video}</p>
              )}
            </div>

            {/* Alternative: Video URL */}
            <div className="space-y-2">
              <Label htmlFor="video-url">Or Video URL (Optional)</Label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://example.com/video.mp4"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter video title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your video content"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL *</Label>
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://example.com/thumbnail.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                className={errors.thumbnailUrl ? 'border-red-500' : ''}
              />
              {errors.thumbnailUrl && (
                <p className="text-sm text-red-600">{errors.thumbnailUrl}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
              <p className="text-sm text-slate-500">
                Separate tags with commas
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <UploadIcon className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </div>
          </form>
        ) : (
          /* Upload Progress */
          <div className="space-y-6 py-8">
            <div className="text-center">
              {uploadStatus === 'completed' ? (
                <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-600" />
              ) : (uploadStatus as UploadStatus) === 'error' ? (
                <AlertCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-600" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
              
              <h3 className="text-lg font-semibold mb-2">
                {getStatusText()}
              </h3>
              
              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-slate-600">
                    {Math.round(uploadProgress)}% complete
                  </p>
                </div>
              )}
              
              {uploadStatus === 'processing' && (
                <p className="text-slate-600">
                  Converting video to optimal formats...
                </p>
              )}
              
              {uploadStatus === 'completed' && (
                <p className="text-green-600">
                  Your video has been uploaded successfully!
                </p>
              )}
              
              {(uploadStatus as UploadStatus) === 'error' && (
                <div className="space-y-3">
                  <p className="text-red-600">
                    Something went wrong during upload.
                  </p>
                  <Button 
                    onClick={() => setUploadStatus('idle')}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  id: string;
}

interface FileUploadProps {
  onFileUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUpload({
  onFileUpload,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = ""
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`;
    }

    if (accept) {
      const extensions = accept.split(',').map(ext => ext.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!extensions.includes(fileExt)) {
        return `File type ${fileExt} is not supported`;
      }
    }

    return null;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    // Check total files limit
    if (files.length + fileList.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "File validation errors",
        description: errors.join(', '),
        variant: "destructive",
      });
    }

    if (newFiles.length === 0) return;

    // Add files with initial status
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      file,
      status: 'uploading',
      progress: 0,
      id: generateId()
    }));

    setFiles(prev => [...prev, ...uploadFiles]);

    // Simulate upload progress
    uploadFiles.forEach(uploadFile => {
      simulateUpload(uploadFile.id);
    });

    // Call callback
    if (onFileUpload) {
      onFileUpload(newFiles);
    }
  };

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + Math.random() * 20, 100);
          if (newProgress >= 100) {
            clearInterval(interval);
            return { ...file, progress: 100, status: Math.random() > 0.1 ? 'success' : 'error' };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className} data-testid="file-upload">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-input hover:border-primary/50'
        }`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        data-testid="upload-area"
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            Drag and drop your files here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supported formats: {accept.replace(/\./g, '').toUpperCase()}
          </p>
          <Button type="button" variant="outline" data-testid="browse-files">
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Max {maxFiles} files, {Math.round(maxSize / (1024 * 1024))}MB each
          </p>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        data-testid="file-input"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3" data-testid="file-list">
          {files.map((uploadFile) => (
            <Card key={uploadFile.id} className="p-4">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        data-testid={`remove-file-${uploadFile.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    <Badge
                      variant={
                        uploadFile.status === 'success' 
                          ? 'default'
                          : uploadFile.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {uploadFile.status === 'uploading' && `${Math.round(uploadFile.progress)}%`}
                      {uploadFile.status === 'success' && 'Uploaded'}
                      {uploadFile.status === 'error' && 'Failed'}
                    </Badge>
                  </div>
                  
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="h-1" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

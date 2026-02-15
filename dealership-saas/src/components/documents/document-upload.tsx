'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Camera, X, FileText, Image as ImageIcon, File as FileIcon, RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { createDocument } from '@/lib/actions/documents';
import { useRouter } from 'next/navigation';
import { DocumentType, EntityType } from '@/lib/types/database';
import { cn } from '@/lib/utils';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'cnic_front', label: 'CNIC Front' },
    { value: 'cnic_back', label: 'CNIC Back' },
    { value: 'registration', label: 'Registration' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'other', label: 'Other' },
];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'deal', label: 'Deal' },
    { value: 'lead', label: 'Lead' },
];

interface DocumentUploadProps {
    entityType?: EntityType;
    entityId?: string;
    onSuccess?: () => void;
    className?: string;
}

export function DocumentUpload({ entityType, entityId, onSuccess, className }: DocumentUploadProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>('other');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(entityType || 'vehicle');
    const [selectedEntityId, setSelectedEntityId] = useState<string>(entityId || '');
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [streaming, setStreaming] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    const stopCamera = useCallback(() => {
        setStreaming(false);
        const stream = streamRef.current;
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            (videoRef.current as any).srcObject = null;
        }
    }, []);

    const resetCapture = useCallback(() => {
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        setCapturedUrl(null);
        setCapturedFile(null);
    }, [capturedUrl]);

    // Enumerate cameras when modal opens
    useEffect(() => {
        if (!cameraOpen) return;

        const enumerateCameras = async () => {
            if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
                return;
            }

            try {
                // Request permission first to get proper device labels
                // This is a quick permission request that we'll close immediately
                try {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    tempStream.getTracks().forEach((track) => track.stop());
                } catch {
                    // Permission denied or not available, but we can still try to enumerate
                }

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter((device) => device.kind === 'videoinput');
                setAvailableCameras(videoDevices);

                // Auto-select first camera if none selected
                if (videoDevices.length > 0 && !selectedCameraId) {
                    setSelectedCameraId(videoDevices[0].deviceId);
                }
            } catch (e) {
                console.error('Error enumerating cameras:', e);
            }
        };

        enumerateCameras();
    }, [cameraOpen, selectedCameraId]);

    const startCamera = useCallback(async (deviceId?: string) => {
        setCameraError(null);
        
        // Stop existing stream if any
        stopCamera();
        
        // Clear captured image to show video again
        if (capturedUrl) {
            URL.revokeObjectURL(capturedUrl);
            setCapturedUrl(null);
            setCapturedFile(null);
        }

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setCameraError('Camera is not supported in this browser/device.');
            return;
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: deviceId
                    ? { deviceId: { exact: deviceId } }
                    : selectedCameraId
                      ? { deviceId: { exact: selectedCameraId } }
                      : { facingMode: { ideal: 'environment' } },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            streamRef.current = stream;
            setStreaming(true);

            if (videoRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (videoRef.current as any).srcObject = stream;
                await videoRef.current.play();
            }
        } catch (e) {
            const msg =
                e instanceof Error
                    ? e.message
                    : 'Unable to access camera. Please allow camera permission.';
            setCameraError(msg);
            stopCamera();
        }
    }, [selectedCameraId, stopCamera, capturedUrl]);

    const capturePhoto = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);

        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
        );
        if (!blob) return;

        const file = new File([blob], `document-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
        });

        resetCapture();
        setCapturedFile(file);
        setCapturedUrl(URL.createObjectURL(file));
        // Auto-stop camera after capture
        stopCamera();
    }, [resetCapture, stopCamera]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCaptureConfirm = async () => {
        if (capturedFile) {
            setSelectedFiles((prev) => [...prev, capturedFile]);
            resetCapture();
            setCameraOpen(false);
            // Ensure camera is stopped when closing
            stopCamera();
        }
    };

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select at least one file');
            return;
        }

        if (!selectedEntityId && !entityId) {
            alert('Please select an entity');
            return;
        }

        setUploading(true);
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            alert('You must be logged in to upload documents');
            setUploading(false);
            return;
        }

        try {
            await Promise.all(
                selectedFiles.map(async (file) => {
                    const fileExt = file.name.split('.').pop() || 'jpg';
                    const fileName = `doc-${selectedDocType}-${Math.random().toString(36).slice(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `documents/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(filePath, file, { upsert: false });

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        throw uploadError;
                    }

                    const {
                        data: { publicUrl },
                    } = supabase.storage.from('documents').getPublicUrl(filePath);

                    await createDocument({
                        entity_type: selectedEntityType,
                        entity_id: selectedEntityId || entityId || '',
                        document_type: selectedDocType,
                        file_name: file.name,
                        file_url: publicUrl,
                        file_size: file.size,
                        mime_type: file.type,
                    });
                })
            );

            setSelectedFiles([]);
            router.refresh();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload documents. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
        return <FileIcon className="h-4 w-4" />;
    };

    return (
        <div className={cn('space-y-4', className)}>
            {!entityId && (
                <div className="space-y-2">
                    <Label>Entity ID</Label>
                    <Input
                        type="text"
                        value={selectedEntityId}
                        onChange={(e) => setSelectedEntityId(e.target.value)}
                        placeholder="Enter entity ID"
                        className="w-full"
                    />
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                {!entityType && (
                    <div className="space-y-2">
                        <Label>Entity Type</Label>
                        <Select value={selectedEntityType} onValueChange={(v) => setSelectedEntityType(v as EntityType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ENTITY_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                />
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setCameraOpen(true)}
                    disabled={uploading}
                    className="w-full sm:w-auto"
                >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full sm:w-auto"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                </Button>
                {selectedFiles.length > 0 && (
                    <Button
                        type="button"
                        onClick={uploadFiles}
                        disabled={uploading}
                        className="w-full sm:w-auto"
                    >
                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                    </Button>
                )}
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <Label>Selected Files</Label>
                    <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded-md"
                            >
                                <div className="flex items-center gap-2">
                                    {getFileIcon(file)}
                                    <span className="text-sm">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog
                open={cameraOpen}
                onOpenChange={(open) => {
                    setCameraOpen(open);
                    if (!open) {
                        stopCamera();
                        resetCapture();
                        setCameraError(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Capture Document</DialogTitle>
                        <DialogDescription>
                            Allow camera access, capture a photo, then click Use This Photo to add it. You can also recapture.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {cameraError ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {cameraError}
                            </div>
                        ) : null}

                        {availableCameras.length > 1 && !capturedUrl ? (
                            <div className="space-y-2">
                                <Label htmlFor="camera-select">Select Camera</Label>
                                <Select
                                    value={selectedCameraId}
                                    onValueChange={(value) => {
                                        setSelectedCameraId(value);
                                        // Restart camera with new device
                                        if (streaming) {
                                            startCamera(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="camera-select" className="w-full">
                                        <SelectValue placeholder="Select a camera" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCameras.map((camera) => (
                                            <SelectItem key={camera.deviceId} value={camera.deviceId}>
                                                {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <div className="rounded-lg border bg-muted overflow-hidden">
                            {capturedUrl ? (
                                <div className="relative aspect-video w-full">
                                    <Image src={capturedUrl} alt="Captured preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 512px" />
                                </div>
                            ) : (
                                <div className="relative aspect-video w-full bg-black">
                                    <video
                                        ref={videoRef}
                                        className="h-full w-full object-cover"
                                        playsInline
                                        muted
                                        autoPlay
                                    />
                                    {!streaming ? (
                                        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
                                            Camera is not started yet.
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        {!streaming && !capturedUrl ? (
                            <Button type="button" variant="secondary" onClick={() => { startCamera(); }}>
                                Start Camera
                            </Button>
                        ) : null}

                        {streaming && !capturedUrl ? (
                            <Button type="button" onClick={capturePhoto}>
                                Capture
                            </Button>
                        ) : null}

                        {capturedUrl ? (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={async () => {
                                        resetCapture();
                                        // Restart camera stream for recapture
                                        await startCamera();
                                    }}
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Recapture
                                </Button>
                                <Button type="button" onClick={handleCaptureConfirm} disabled={uploading}>
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Use This Photo
                                </Button>
                            </>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

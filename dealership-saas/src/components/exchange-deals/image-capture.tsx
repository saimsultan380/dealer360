'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, RefreshCcw, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ImageCaptureProps {
    onImageUploaded: (dataUrl: string) => void;
    onImageRemoved?: () => void;
    image?: string;
    label: string;
    description: string;
    className?: string;
}

export function ImageCapture({
    onImageUploaded,
    onImageRemoved,
    image,
    label,
    description,
    className,
}: ImageCaptureProps) {
    const [uploading, setUploading] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [streaming, setStreaming] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);

    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');

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
                try {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    tempStream.getTracks().forEach((track) => track.stop());
                } catch {
                    // Permission denied or not available
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

    const onUploadChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files || e.target.files.length === 0) return;
            
            setUploading(true);
            const file = e.target.files[0];
            
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    onImageUploaded(dataUrl);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error uploading image:', error);
            } finally {
                setUploading(false);
            }
            
            e.target.value = '';
        },
        [onImageUploaded]
    );

    const startCamera = useCallback(
        async (deviceId?: string) => {
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
        },
        [selectedCameraId, stopCamera, capturedUrl]
    );

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

        const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
        });

        resetCapture();
        setCapturedFile(file);
        setCapturedUrl(URL.createObjectURL(file));
        // Auto-stop camera after capture
        stopCamera();
    }, [resetCapture, stopCamera]);

    const saveCaptured = useCallback(async () => {
        if (!capturedFile) return;
        
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                onImageUploaded(dataUrl);
                // Close the modal after successful upload
                setCameraOpen(false);
            };
            reader.readAsDataURL(capturedFile);
        } catch (error) {
            console.error('Error saving captured image:', error);
        } finally {
            setUploading(false);
        }
    }, [capturedFile, onImageUploaded]);

    const removeImage = () => {
        onImageRemoved?.();
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <input
                        ref={uploadInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onUploadChange}
                        disabled={uploading}
                    />

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setCameraOpen(true)}
                        disabled={uploading}
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
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </Button>
                </div>
            </div>

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
                        <DialogTitle>Capture {label}</DialogTitle>
                        <DialogDescription>
                            Allow camera access, capture a photo, then click Save to upload. You can also recapture.
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
                                    <Image src={capturedUrl} alt="Captured preview" fill className="object-cover" />
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
                            <Button type="button" variant="secondary" onClick={() => startCamera()}>
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
                                <Button type="button" onClick={saveCaptured} disabled={uploading}>
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save & Upload
                                </Button>
                            </>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {image ? (
                <div className="relative aspect-video w-full max-w-md rounded-md overflow-hidden bg-muted border group">
                    <Image src={image} alt={label} fill className="object-cover" />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No photo added yet.
                </div>
            )}
        </div>
    );
}

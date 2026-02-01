'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Camera, RefreshCcw, Upload, X, User, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImageFile {
    file: File;
    preview: string;
}

interface BuyerImageUploadProps {
    onImagesChange: (images: {
        photo?: File;
        cnicFront?: File;
        cnicBack?: File;
    }) => void;
    disabled?: boolean;
}

type BuyerDocType = 'photo' | 'cnicFront' | 'cnicBack';

interface SingleImageUploadProps {
    label: string;
    icon: React.ReactNode;
    image: ImageFile | null;
    onImageChange: (image: ImageFile | null) => void;
    disabled?: boolean;
    boxClassName?: string;
    previewFit?: 'cover' | 'contain';
    docType: BuyerDocType;
    onCaptureClick: (type: BuyerDocType) => void;
    onFileSelect: (type: BuyerDocType, file: File) => void;
}

function SingleImageUpload({
    label,
    icon,
    image,
    onImageChange,
    disabled,
    boxClassName,
    previewFit = 'contain',
    docType,
    onCaptureClick,
    onFileSelect,
}: SingleImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const localFileInputRef = useRef<HTMLInputElement | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setIsUploading(true);
            const file = acceptedFiles[0];
            onFileSelect(docType, file);
            setIsUploading(false);
        }
    }, [docType, onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        disabled: disabled || isUploading,
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (image) {
            URL.revokeObjectURL(image.preview);
            onImageChange(null);
        }
    };

    const handleUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        localFileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(docType, file);
        }
        e.target.value = '';
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                    {icon}
                    {label}
                </Label>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => onCaptureClick(docType)}
                        disabled={disabled}
                    >
                        <Camera className="h-3 w-3" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={handleUploadClick}
                        disabled={disabled}
                    >
                        <Upload className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <input
                ref={localFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />
            <div
                {...getRootProps()}
                className={cn(
                    'relative w-full overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
                    'bg-muted/20',
                    boxClassName ?? 'h-40',
                    'hover:border-primary/50 hover:bg-muted/50',
                    isDragActive && 'border-primary bg-primary/5',
                    image && 'border-solid border-primary/30',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input {...getInputProps()} />

                {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : image ? (
                    <>
                        <Image
                            src={image.preview}
                            alt={label}
                            fill
                            className={cn(previewFit === 'cover' ? 'object-cover' : 'object-contain', 'bg-muted')}
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 shadow-lg"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
                        <Upload className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-xs text-center">
                            {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function BuyerImageUpload({ onImagesChange, disabled }: BuyerImageUploadProps) {
    const [photo, setPhoto] = useState<ImageFile | null>(null);
    const [cnicFront, setCnicFront] = useState<ImageFile | null>(null);
    const [cnicBack, setCnicBack] = useState<ImageFile | null>(null);

    // Camera state - one modal for all document types
    const [activeDocType, setActiveDocType] = useState<BuyerDocType>('photo');
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [streaming, setStreaming] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);

    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');

    const docTypeLabel = useMemo(() => {
        if (activeDocType === 'photo') return 'Buyer Photo';
        if (activeDocType === 'cnicFront') return 'CNIC Front';
        return 'CNIC Back';
    }, [activeDocType]);

    const stopCamera = useCallback(() => {
        setStreaming(false);
        const stream = streamRef.current;
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (videoRef.current as any).srcObject = null;
        }
    }, []);

    const resetCapture = useCallback(() => {
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        setCapturedUrl(null);
        setCapturedFile(null);
    }, [capturedUrl]);

    useEffect(() => {
        if (!cameraOpen) return;
        const enumerate = async () => {
            if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
            try {
                try {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    tempStream.getTracks().forEach((t) => t.stop());
                } catch {
                    // ignore
                }
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter((d) => d.kind === 'videoinput');
                setAvailableCameras(videoDevices);
                if (videoDevices.length > 0 && !selectedCameraId) {
                    setSelectedCameraId(videoDevices[0].deviceId);
                }
            } catch (e) {
                console.error('Error enumerating cameras:', e);
            }
        };
        enumerate();
    }, [cameraOpen, selectedCameraId]);

    const startCamera = useCallback(async (deviceId?: string) => {
        setCameraError(null);
        stopCamera();
        resetCapture();

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
                e instanceof Error ? e.message : 'Unable to access camera. Please allow camera permission.';
            setCameraError(msg);
            stopCamera();
        }
    }, [resetCapture, selectedCameraId, stopCamera]);

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

        const file = new File([blob], `${activeDocType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resetCapture();
        setCapturedFile(file);
        setCapturedUrl(URL.createObjectURL(file));
        // Auto-stop camera after capture
        stopCamera();
    }, [activeDocType, resetCapture, stopCamera]);

    const setImageForType = useCallback((type: BuyerDocType, file: File) => {
        const preview = URL.createObjectURL(file);
        const image: ImageFile = { file, preview };

        if (type === 'photo') setPhoto(image);
        if (type === 'cnicFront') setCnicFront(image);
        if (type === 'cnicBack') setCnicBack(image);
    }, []);

    // propagate changes whenever any image changes
    useEffect(() => {
        onImagesChange({
            photo: photo?.file,
            cnicFront: cnicFront?.file,
            cnicBack: cnicBack?.file,
        });
    }, [photo, cnicFront, cnicBack, onImagesChange]);

    const handleCaptureClick = useCallback((type: BuyerDocType) => {
        setActiveDocType(type);
        setCameraOpen(true);
    }, []);

    const handleFileSelect = useCallback((type: BuyerDocType, file: File) => {
        setImageForType(type, file);
    }, [setImageForType]);

    const saveCaptured = useCallback(async () => {
        if (!capturedFile) return;
        setImageForType(activeDocType, capturedFile);
        setCameraOpen(false);
    }, [capturedFile, activeDocType, setImageForType]);

    const handlePhotoChange = (image: ImageFile | null) => {
        setPhoto(image);
    };

    const handleCnicFrontChange = (image: ImageFile | null) => {
        setCnicFront(image);
    };

    const handleCnicBackChange = (image: ImageFile | null) => {
        setCnicBack(image);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
                {/* Buyer Photo */}
                <Card className="lg:col-span-4 overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Buyer Photo
                        </CardTitle>
                        <CardDescription className="text-xs">Capture or upload buyer photo</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <SingleImageUpload
                            label="Buyer Photo"
                            icon={<User className="h-4 w-4" />}
                            image={photo}
                            onImageChange={handlePhotoChange}
                            disabled={disabled}
                            boxClassName="h-44 rounded-2xl"
                            previewFit="cover"
                            docType="photo"
                            onCaptureClick={handleCaptureClick}
                            onFileSelect={handleFileSelect}
                        />
                    </CardContent>
                </Card>

                {/* CNIC */}
                <Card className="lg:col-span-8 overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            CNIC
                        </CardTitle>
                        <CardDescription className="text-xs">Front & back (clear, readable)</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SingleImageUpload
                                label="CNIC Front"
                                icon={<CreditCard className="h-4 w-4" />}
                                image={cnicFront}
                                onImageChange={handleCnicFrontChange}
                                disabled={disabled}
                                boxClassName="h-40"
                                previewFit="contain"
                                docType="cnicFront"
                                onCaptureClick={handleCaptureClick}
                                onFileSelect={handleFileSelect}
                            />

                            <SingleImageUpload
                                label="CNIC Back"
                                icon={<CreditCard className="h-4 w-4" />}
                                image={cnicBack}
                                onImageChange={handleCnicBackChange}
                                disabled={disabled}
                                boxClassName="h-40"
                                previewFit="contain"
                                docType="cnicBack"
                                onCaptureClick={handleCaptureClick}
                                onFileSelect={handleFileSelect}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            Tips: keep the CNIC inside the frame and avoid glare. Formats: JPEG/PNG/WebP.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Camera Modal */}
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
                        <DialogTitle>Capture {docTypeLabel}</DialogTitle>
                        <DialogDescription>
                            Allow camera access, capture a photo, then click Save. You can recapture if needed.
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
                                <Label htmlFor="buyer-camera-select">Select Camera</Label>
                                <Select
                                    value={selectedCameraId}
                                    onValueChange={(value) => {
                                        setSelectedCameraId(value);
                                        if (streaming) startCamera(value);
                                    }}
                                >
                                    <SelectTrigger id="buyer-camera-select" className="w-full">
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
                                        await startCamera();
                                    }}
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Recapture
                                </Button>
                                <Button type="button" onClick={saveCaptured}>
                                    Save
                                </Button>
                            </>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

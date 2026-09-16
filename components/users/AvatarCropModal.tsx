"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Upload,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Crop,
} from "lucide-react";
import { processAvatarImage, uploadAvatarAndSyncDb, loadImageFromFile } from "@/utils/avatarUtils";

export interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (publicUrl: string) => void;
  isLight: boolean;
  isThai: boolean;
}

export function AvatarCropModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
  isLight,
  isThai,
}: AvatarCropModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewSizeKB, setPreviewSizeKB] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setImageObj(null);
      setImageSrc("");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setErrorMsg(null);
      setIsProcessing(false);
      setPreviewSizeKB(null);
    }
  }, [isOpen]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // File Loader helper
  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg(isThai ? "กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, WebP)" : "Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(isThai ? "ไฟล์รูปภาพขนาดเกิน 10MB" : "File size exceeds 10MB.");
      return;
    }

    try {
      setErrorMsg(null);
      setSelectedFile(file);
      const img = await loadImageFromFile(file);
      setImageObj(img);
      setImageSrc(img.src);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch {
      setErrorMsg(isThai ? "ไม่สามารถอ่านไฟล์รูปภาพได้" : "Could not load image file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Clamp Pan helper so crop viewport never extends outside image boundaries
  const clampPan = (
    currentPan: { x: number; y: number },
    currentZoom: number,
    img: HTMLImageElement | null
  ) => {
    if (!img) return currentPan;
    const viewportSize = 280;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Viewport relative to natural dimensions at scale:
    // displayedWidth = viewportSize * (naturalWidth / minDim) * currentZoom
    // displayedHeight = viewportSize * (naturalHeight / minDim) * currentZoom
    const minDim = Math.min(naturalWidth, naturalHeight);
    const displayedWidth = (naturalWidth / minDim) * viewportSize * currentZoom;
    const displayedHeight = (naturalHeight / minDim) * viewportSize * currentZoom;

    const maxPanX = Math.max(0, (displayedWidth - viewportSize) / 2);
    const maxPanY = Math.max(0, (displayedHeight - viewportSize) / 2);

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, currentPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, currentPan.y)),
    };
  };

  // Mouse / Touch Drag handlers for panning with strict boundary clamping
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawPan = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPan(clampPan(rawPan, zoom, imageObj));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setPan((prevPan) => clampPan(prevPan, newZoom, imageObj));
  };

  // Crop & Submit Process
  const handleCropAndSubmit = async () => {
    if (!imageObj) return;

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      // Compute actual crop box strictly within image bounds
      const viewportSize = 280;
      const naturalWidth = imageObj.naturalWidth;
      const naturalHeight = imageObj.naturalHeight;
      const minDim = Math.min(naturalWidth, naturalHeight);

      // Scale factor from viewport pixels to natural image pixels
      const scaleFactor = minDim / (viewportSize * zoom);
      const cropSize = viewportSize * scaleFactor;

      // Center offset
      const clamped = clampPan(pan, zoom, imageObj);
      const naturalCenterX = naturalWidth / 2 - clamped.x * scaleFactor;
      const naturalCenterY = naturalHeight / 2 - clamped.y * scaleFactor;

      const cropX = Math.max(0, Math.min(naturalWidth - cropSize, naturalCenterX - cropSize / 2));
      const cropY = Math.max(0, Math.min(naturalHeight - cropSize, naturalCenterY - cropSize / 2));

      // 1. Process client-side: 1:1 square crop with circular mask, max 400x400, .webp quality 80%, check <= 500KB
      const { blob, sizeKB } = await processAvatarImage(
        imageObj,
        { x: cropX, y: cropY, size: cropSize },
        400,
        0.8
      );

      setPreviewSizeKB(sizeKB);

      // 2. Upload to Storage 'avatars/{user_id}.webp' with upsert: true & update Database
      const { publicUrl, error } = await uploadAvatarAndSyncDb(userId || "default_user", blob);

      if (error) {
        throw new Error(error);
      }

      onSuccess(publicUrl);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={containerRef}
        className={`relative w-full max-w-[480px] rounded-[24px] border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${
          isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#2A2A2A] border-[#444444] text-[#FFFFFF]"
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${isLight ? "border-[#E4E4E7]" : "border-[#3E3E3E]"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isLight ? "bg-indigo-50 text-indigo-600" : "bg-indigo-500/20 text-indigo-400"}`}>
              <Crop size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {isThai ? "ปรับแต่งและอัปโหลดรูปโปรไฟล์" : "Crop & Upload Profile Picture"}
              </h3>
              <p className="text-[11px] opacity-70 mt-0.5">
                {isThai ? "สัดส่วน 1:1 • ขนาดสูงสุด 400x400 px • WebP" : "1:1 Aspect Ratio • Max 400x400 px • WebP"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? "text-slate-400 hover:text-black hover:bg-slate-100" : "text-zinc-400 hover:text-white hover:bg-[#383838]"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center gap-5">
          {errorMsg && (
            <div className="w-full p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!imageSrc ? (
            /* Upload Initial Trigger Box (Square Aspect Ratio & Drag-and-Drop) */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-[340px] aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-500/15 scale-[1.02] shadow-xl"
                  : isLight
                  ? "border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 bg-slate-50 shadow-inner"
                  : "border-zinc-600 hover:border-indigo-400 hover:bg-indigo-950/10 bg-[#202020] shadow-inner"
              }`}
            >
              <div className={`p-5 rounded-2xl transition-transform ${isDragOver ? "scale-110" : ""} ${isLight ? "bg-white text-indigo-600 shadow-md" : "bg-[#333333] text-indigo-400"}`}>
                <Upload size={34} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sm block">
                  {isDragOver
                    ? isThai ? "ปล่อยไฟล์รูปที่นี่เลย" : "Drop image file here"
                    : isThai ? "ลากรูปมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์" : "Drag & Drop image here or click to browse"}
                </span>
                <span className="text-xs opacity-60 block">
                  PNG, JPG, JPEG, WebP (สูงสุด 10MB)
                </span>
              </div>
            </div>
          ) : (
            /* Interactive 1:1 Square Crop Viewport with Circular Guide Overlay */
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Square 1:1 Viewport with Circular Preview Overlay */}
              <div className="relative flex items-center justify-center p-2 rounded-2xl bg-black/5 dark:bg-black/30">
                <div
                  className="relative w-[280px] h-[280px] rounded-2xl overflow-hidden border-2 border-indigo-500 ring-4 ring-indigo-500/20 shadow-2xl select-none cursor-grab active:cursor-grabbing bg-neutral-900"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt="Crop preview"
                    draggable={false}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 0.1s ease-out",
                    }}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* Circular Overlay Guide with Dimmed Corners */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                      borderRadius: "50%",
                    }}
                  />

                  {/* Circular Boundary Ring & Grid */}
                  <div className="absolute inset-0 border-2 border-white/80 pointer-events-none rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                    <div className="w-full h-[1px] bg-white" />
                    <div className="h-full w-[1px] bg-white absolute" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <span className="text-[11px] font-medium opacity-60">
                {isThai
                  ? "กรอบสี่เหลี่ยม 1:1 พร้อมพรีวิวรูปโปรไฟล์วงกลม • ลากเพื่อปรับตำแหน่ง"
                  : "1:1 Square Crop with Circular Profile Preview • Drag to reposition"}
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center gap-3 w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => handleZoomChange(Math.max(1, zoom - 0.2))}
                  className={`p-2 rounded-lg border text-xs cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-[#333] hover:bg-[#444]"}`}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleZoomChange(Math.min(3, zoom + 0.2))}
                  className={`p-2 rounded-lg border text-xs cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-[#333] hover:bg-[#444]"}`}
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              {/* Re-select new image button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 ${
                  isLight ? "text-indigo-600" : "text-indigo-400"
                }`}
              >
                <ImageIcon size={12} />
                <span>{isThai ? "เลือกรูปอื่น" : "Choose a different image"}</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Modal Footer Actions */}
        <div className={`flex items-center justify-end gap-2.5 p-4 sm:px-6 border-t shrink-0 ${isLight ? "border-[#E4E4E7] bg-[#FAFAFA]" : "border-[#3E3E3E] bg-[#222222]"}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              isLight ? "text-slate-500 hover:text-black hover:bg-slate-200/60" : "text-zinc-400 hover:text-white hover:bg-[#383838]"
            }`}
          >
            {isThai ? "ยกเลิก" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleCropAndSubmit}
            disabled={!imageSrc || isProcessing}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all ${
              !imageSrc || isProcessing
                ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-[#444444] text-slate-500"
                : isLight
                ? "bg-[#222222] text-white hover:bg-black cursor-pointer"
                : "bg-white text-[#222222] hover:bg-zinc-200 cursor-pointer"
            }`}
          >
            {isProcessing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            <span>
              {isProcessing
                ? isThai ? "กำลังประมวลผลและอัปโหลด..." : "Processing & Uploading..."
                : isThai ? "บันทึกรูปโปรไฟล์" : "Crop & Save Avatar"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

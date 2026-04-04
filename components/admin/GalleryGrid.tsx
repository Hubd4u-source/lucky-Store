"use client"

import * as React from "react"
import { Image as ImageIcon, X, Plus, MoveLeft, MoveRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageCropperModal } from "./ImageCropperModal"

interface GalleryGridProps {
  images: (File | string)[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  onReorder?: (newOrder: (File | string)[]) => void
}

export function GalleryGrid({ images, onAdd, onRemove, onReorder }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([])
  const [croppedFiles, setCroppedFiles] = React.useState<File[]>([])
  const [isCropperOpen, setIsCropperOpen] = React.useState(false)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Ensure index stays valid if images are removed
  React.useEffect(() => {
    if (selectedIndex >= images.length && images.length > 0) {
      setSelectedIndex(images.length - 1)
    }
  }, [images.length, selectedIndex])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setPendingFiles(files)
      setCroppedFiles([])
      setIsCropperOpen(true)
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCropConfirm = (cropped: File) => {
    const nextCropped = [...croppedFiles, cropped]
    const nextPending = pendingFiles.slice(1)
    
    if (nextPending.length > 0) {
      setCroppedFiles(nextCropped)
      setPendingFiles(nextPending)
    } else {
      // All files processed
      const oldLen = images.length
      onAdd(nextCropped)
      if (oldLen === 0) setSelectedIndex(0)
      
      setPendingFiles([])
      setCroppedFiles([])
      setIsCropperOpen(false)
    }
  }

  const handleCropCancel = () => {
    // If they cancel, we discard the current queue for simplicity
    setPendingFiles([])
    setCroppedFiles([])
    setIsCropperOpen(false)
  }

  const move = (e: React.MouseEvent, index: number, direction: -1 | 1) => {
    e.stopPropagation() // Don't trigger thumbnail selection
    if (!onReorder) return
    const newImages = [...images]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= images.length) return
    
    const temp = newImages[index]
    newImages[index] = newImages[targetIndex]
    newImages[targetIndex] = temp
    onReorder(newImages)
    
    // Track the moved item if it was selected
    if (selectedIndex === index) setSelectedIndex(targetIndex)
    else if (selectedIndex === targetIndex) setSelectedIndex(index)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Large Preview Selector - "Perfectly seen" */}
      <div className="relative aspect-video w-full border border-border-strong bg-black/40 overflow-hidden flex items-center justify-center">
        {images.length > 0 ? (
          <div className="relative h-full w-full">
            <img 
              src={typeof images[selectedIndex] === "string" ? images[selectedIndex] as string : URL.createObjectURL(images[selectedIndex] as File)} 
              alt="Selected Preview"
              className="h-full w-full object-contain"
            />
            {/* Overlay Label */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="bg-bg-base/90 border border-border-subtle px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-text-primary backdrop-blur-sm">
                Preview: {selectedIndex === 0 ? "Main Thumbnail" : `Image #${selectedIndex + 1}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <ImageIcon size={32} strokeWidth={1.5} />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">No images selected</p>
          </div>
        )}
      </div>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img, index) => (
          <div 
            key={index} 
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "group relative aspect-square border overflow-hidden cursor-pointer transition-all",
              selectedIndex === index 
                ? "border-accent ring-1 ring-accent bg-accent/5 scale-95" 
                : "border-border-default bg-bg-surface-2 hover:border-border-strong"
            )}
          >
            {/* Thumbnail */}
            <img 
              src={typeof img === "string" ? img : URL.createObjectURL(img)} 
              alt={`Thumb ${index + 1}`}
              className="h-full w-full object-cover"
            />
            
            {/* Controls */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
              <button
                type="button"
                onClick={(e) => move(e, index, -1)}
                disabled={index === 0}
                className="p-1 bg-bg-surface border border-border-default hover:border-accent disabled:opacity-20"
              >
                <MoveLeft size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(index)
                }}
                className="p-1 bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20"
              >
                <X size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => move(e, index, 1)}
                disabled={index === images.length - 1}
                className="p-1 bg-bg-surface border border-border-default hover:border-accent disabled:opacity-20"
              >
                <MoveRight size={12} />
              </button>
            </div>

            {/* Badge */}
            {index === 0 && (
              <div className="absolute top-0.5 right-0.5 bg-accent px-1 py-0.5 font-mono text-[7px] uppercase tracking-tighter text-white">
                Main
              </div>
            )}
          </div>
        ))}

        {/* Add Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square border border-dashed border-border-strong bg-bg-surface-2 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-accent hover:text-accent transition-all group"
        >
          <div className="p-2 border border-border-default group-hover:border-accent/30 rounded-full transition-colors">
            <Plus size={20} />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest">Add Image</span>
        </button>
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      
      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted text-center italic">
        First image is the primary store thumbnail
      </p>

      <ImageCropperModal
        open={isCropperOpen}
        file={pendingFiles[0] || null}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  )
}

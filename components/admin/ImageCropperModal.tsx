"use client"

import * as React from "react"
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Crop as CropIcon, Check, X } from "lucide-react"

interface ImageCropperModalProps {
  open: boolean
  file: File | null
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

const ASPECT_RATIO = 4 / 3

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export function ImageCropperModal({ open, file, onConfirm, onCancel }: ImageCropperModalProps) {
  const [imgSrc, setImgSrc] = React.useState("")
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>()

  React.useEffect(() => {
    if (file) {
      setCrop(undefined) // Reset crop
      const reader = new FileReader()
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      )
      reader.readAsDataURL(file)
    } else {
      setImgSrc("")
    }
  }, [file])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, ASPECT_RATIO))
  }

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop || !file) return

    const image = imgRef.current
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    
    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name, {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
        onConfirm(croppedFile)
      }
    }, "image/jpeg", 0.95)
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Select Preview Area"
      maxWidth="720px"
    >
      <div className="flex flex-col gap-6 p-1">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="p-2 bg-accent/10 border border-accent/20 rounded">
            <CropIcon className="text-accent" size={18} />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Interactive Selector</p>
            <p className="text-sm text-text-secondary mt-0.5">Drag and resize to choose the perfect preview for your store.</p>
          </div>
        </div>

        <div className="relative min-h-[300px] max-h-[60vh] overflow-auto bg-black/40 flex items-center justify-center border border-border-default">
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT_RATIO}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-[50vh] object-contain"
              />
            </ReactCrop>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Loading image...</p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onCancel} className="gap-2 min-h-11 px-6">
            <X size={14} />
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2 min-h-11 px-8">
            <Check size={14} />
            Confirm Selection
          </Button>
        </div>
      </div>
    </Modal>
  )
}

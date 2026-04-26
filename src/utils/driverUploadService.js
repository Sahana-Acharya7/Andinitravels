import { DRIVER_UPLOAD_BUCKET, getSupabaseClient } from '../supabase'

const MAX_IMAGE_DIMENSION = 1600
const IMAGE_QUALITY = 0.78
const SIGNED_URL_TTL_SECONDS = 60 * 60

export async function uploadDriverFilesToSupabase(storageId, selectedFiles, currentForm) {
  const nextUploads = {
    driverPhotoUrl: currentForm.driverPhotoUrl || '',
    aadhaarPhotoUrl: currentForm.aadhaarPhotoUrl || '',
    dlPhotoUrl: currentForm.dlPhotoUrl || '',
    panPhotoUrl: currentForm.panPhotoUrl || '',
    carPhotoUrls: Array.isArray(currentForm.carPhotoUrls) ? currentForm.carPhotoUrls : [],
  }

  const hasFiles =
    selectedFiles.driverPhoto ||
    selectedFiles.aadhaarPhoto ||
    selectedFiles.dlPhoto ||
    selectedFiles.panPhoto ||
    selectedFiles.carPhotos.length

  if (!hasFiles) return nextUploads

  if (selectedFiles.driverPhoto) {
    nextUploads.driverPhotoUrl = await uploadCompressedImage(
      storageId,
      'driver-photo',
      selectedFiles.driverPhoto,
    )
  }

  if (selectedFiles.aadhaarPhoto) {
    nextUploads.aadhaarPhotoUrl = await uploadCompressedImage(
      storageId,
      'aadhaar-photo',
      selectedFiles.aadhaarPhoto,
    )
  }

  if (selectedFiles.dlPhoto) {
    nextUploads.dlPhotoUrl = await uploadCompressedImage(
      storageId,
      'dl-photo',
      selectedFiles.dlPhoto,
    )
  }

  if (selectedFiles.panPhoto) {
    nextUploads.panPhotoUrl = await uploadCompressedImage(
      storageId,
      'pan-photo',
      selectedFiles.panPhoto,
    )
  }

  if (selectedFiles.carPhotos.length) {
    nextUploads.carPhotoUrls = await Promise.all(
      selectedFiles.carPhotos.map((file, index) =>
        uploadCompressedImage(storageId, `car-photo-${index + 1}`, file),
      ),
    )
  }

  return nextUploads
}

export async function resolveDriverFileUrls(references) {
  const validReferences = references.filter(Boolean)
  if (!validReferences.length) return []

  const httpReferences = validReferences.filter(isHttpUrl)
  const storageReferences = validReferences.filter(reference => !isHttpUrl(reference))

  if (!storageReferences.length) {
    return httpReferences
  }

  const supabase = getSupabaseClient()
  const resolvedUrls = await Promise.all(
    storageReferences.map(async reference => {
      // First try to create a signed URL (requires permission)
      const { data, error } = await supabase.storage
        .from(DRIVER_UPLOAD_BUCKET)
        .createSignedUrl(reference, SIGNED_URL_TTL_SECONDS)

      if (data?.signedUrl) {
        return data.signedUrl
      }

      // If signed URL fails, try to get a public URL (works if bucket/file is public)
      const { data: publicData } = supabase.storage
        .from(DRIVER_UPLOAD_BUCKET)
        .getPublicUrl(reference)

      if (publicData?.publicUrl) {
        return publicData.publicUrl
      }

      console.warn(`Could not resolve storage file ${reference}:`, error?.message || 'Unknown error')
      return null
    }),
  )

  return [...httpReferences, ...resolvedUrls.filter(Boolean)]
}

async function uploadCompressedImage(storageId, label, file) {
  const compressedFile = await compressImage(file)
  const objectPath = buildUploadPath(storageId, label, compressedFile.type)
  const supabase = getSupabaseClient()
  const { error } = await supabase.storage.from(DRIVER_UPLOAD_BUCKET).upload(objectPath, compressedFile, {
    cacheControl: '31536000',
    contentType: compressedFile.type,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message || 'Upload failed.')
  }

  return objectPath
}

async function compressImage(file) {
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file
  }

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height))
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) return file

  canvas.width = targetWidth
  canvas.height = targetHeight
  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const outputType = selectOutputType(file.type)
  const blob = await canvasToBlob(canvas, outputType, IMAGE_QUALITY)

  if (!blob || blob.size >= file.size) {
    return file
  }

  return new File([blob], replaceFileExtension(file.name, extensionFromMimeType(blob.type)), {
    type: blob.type,
    lastModified: Date.now(),
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not read image file ${file.name}.`))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality)
  })
}

function selectOutputType(sourceType) {
  if (sourceType === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

function buildUploadPath(storageId, label, contentType) {
  const safeLabel = sanitizePart(label)
  const extension = extensionFromMimeType(contentType)
  const uniqueId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `drivers/${sanitizePart(storageId)}/${safeLabel}-${Date.now()}-${uniqueId}.${extension}`
}

function sanitizePart(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_/]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^-+|-+$/g, '')
}

function extensionFromMimeType(type) {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/jpeg') return 'jpg'
  return 'bin'
}

function replaceFileExtension(fileName, extension) {
  const baseName = fileName.replace(/\.[^/.]+$/, '')
  return `${baseName}.${extension}`
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value)
}

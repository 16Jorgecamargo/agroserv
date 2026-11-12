import type { MockUploadPayload } from '../types/api'
import type { Upload, UploadPurpose } from '../types/entities'
import { ACCEPTED_FILE_TYPES, validateUploadFile } from '../utils/validators'
import { apiClient, isMockMode } from './api/apiClient'
import { ApiError } from './api/apiError'

const MAX_IMAGE_SIDE = 1280

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler o arquivo.'))
    reader.readAsDataURL(blob)
  })
}

export async function resizeImage(file: File, maxSide = MAX_IMAGE_SIDE): Promise<Blob> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const resized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.85))
    return resized && resized.size < file.size ? resized : file
  } catch {
    return file
  }
}

export const uploadService = {
  async upload(file: File, purpose: UploadPurpose = 'public', acceptedTypes: string[] = ACCEPTED_FILE_TYPES): Promise<Upload> {
    const error = validateUploadFile(file, acceptedTypes)
    if (error) throw new ApiError({ status: 422, code: 'validation_error', message: error, fields: { file: error } })

    const prepared = await resizeImage(file)

    if (isMockMode) {
      const payload: MockUploadPayload = {
        name: file.name,
        contentType: file.type,
        dataUrl: await readAsDataUrl(prepared),
        purpose,
      }
      return apiClient.post<Upload>('/uploads', payload)
    }

    const form = new FormData()
    form.append('file', prepared, file.name)
    form.append('purpose', purpose)
    return apiClient.post<Upload>('/uploads', form)
  },
}

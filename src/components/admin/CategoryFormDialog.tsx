import { useState, type FormEvent } from 'react'
import { useToast } from '../../hooks/useToast'
import { adminService } from '../../services/adminService'
import { isApiError } from '../../services/apiError'
import type { AdminCategory, CategoryPayload } from '../../types/api'
import type { CategoryIcon as CategoryIconName } from '../../types/entities'
import { categoryIconLabels, categoryIcons, SLUG_PATTERN } from '../../utils/categoryIcons'
import { cn } from '../../utils/cn'
import { CategoryIcon } from '../domain/CategoryIcon'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

interface FormErrors {
  name?: string
  slug?: string
  icon?: string
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CategoryFormProps {
  category?: AdminCategory
  onClose: () => void
  onSaved: () => void
}

function CategoryForm({ category, onClose, onSaved }: CategoryFormProps) {
  const toast = useToast()
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(category))
  const [icon, setIcon] = useState<CategoryIconName | ''>(category?.icon ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)
  const effectiveSlug = slugTouched ? slug : toSlug(name)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    const nextErrors: FormErrors = {}
    if (name.trim().length < 2 || name.trim().length > 40) nextErrors.name = 'Informe o nome.'
    if (effectiveSlug && !SLUG_PATTERN.test(effectiveSlug)) nextErrors.slug = 'Use apenas letras minúsculas, números e hífen.'
    if (!icon) nextErrors.icon = 'Selecione um ícone.'
    setErrors(nextErrors)
    setFormError(undefined)
    if (Object.keys(nextErrors).length || !icon) return

    const payload: CategoryPayload = { name: name.trim(), icon, ...(effectiveSlug ? { slug: effectiveSlug } : {}) }
    setIsSaving(true)
    try {
      if (category) await adminService.updateCategory(category.id, payload)
      else await adminService.createCategory(payload)
      toast.success(category ? 'Categoria atualizada.' : 'Categoria criada.')
      onSaved()
      onClose()
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as FormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível salvar a categoria.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <Input label="Nome" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} error={errors.name} />
      <div>
        <Input
          label="Endereço"
          value={effectiveSlug}
          onChange={(event) => {
            setSlugTouched(true)
            setSlug(event.target.value)
          }}
          error={errors.slug}
          aria-describedby="category-slug-hint"
        />
        <p id="category-slug-hint" className="mt-1.5 text-xs text-text-muted">
          Usado no filtro da busca: /servicos?categoria={effectiveSlug || 'endereco'}
        </p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">Ícone</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {categoryIcons.map((option) => (
            <label
              key={option}
              className={cn(
                'grid cursor-pointer place-items-center gap-1 rounded-lg border border-border p-2 text-[11px] text-text-muted transition-colors hover:border-primary',
                icon === option && 'border-primary bg-primary-soft text-primary',
              )}
            >
              <input type="radio" name="category-icon" value={option} checked={icon === option} onChange={() => setIcon(option)} className="sr-only" />
              <CategoryIcon name={option} className="size-5" />
              {categoryIconLabels[option]}
            </label>
          ))}
        </div>
        {errors.icon && <p className="mt-1.5 text-sm text-danger">{errors.icon}</p>}
      </fieldset>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSaving}>
          {category ? 'Salvar categoria' : 'Criar categoria'}
        </Button>
      </div>
    </form>
  )
}

interface CategoryFormDialogProps {
  isOpen: boolean
  category?: AdminCategory
  onClose: () => void
  onSaved: () => void
}

export function CategoryFormDialog({ isOpen, category, onClose, onSaved }: CategoryFormDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? `Editar ${category.name}` : 'Nova categoria'}>
      <CategoryForm key={category?.id ?? 'new'} category={category} onClose={onClose} onSaved={onSaved} />
    </Modal>
  )
}

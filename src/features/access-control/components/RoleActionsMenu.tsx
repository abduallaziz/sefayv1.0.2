import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui'
import { RoleSummary } from '../api/access-control.api'

interface RoleActionsMenuProps {
  role: RoleSummary
  onView: (role: RoleSummary) => void
  onEdit: (role: RoleSummary) => void
  onDelete: (role: RoleSummary) => void
}

// System roles never expose Edit/Delete in the DOM at all — not just
// disabled — per spec: "completely hide/omit ... from the DOM."
export function RoleActionsMenu({ role, onView, onEdit, onDelete }: RoleActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {role.is_system ? (
          <DropdownMenuItem onClick={() => onView(role)}>
            <Eye className="h-4 w-4 me-2" /> View-Only Permissions
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onEdit(role)}>
              <Pencil className="h-4 w-4 me-2" /> Edit Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(role)}
              className="text-slate-600 hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 me-2" /> Delete Role
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

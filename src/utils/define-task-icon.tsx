import { Icons } from '@/components/common';

const defineTaskIcon = (
  taskIcon?: string
) => {
  switch (taskIcon) {
    case 'github':
      return Icons.GithubIcon
    case 'x':
      return Icons.XIcon
    default:
      return undefined
  }
}

export default defineTaskIcon

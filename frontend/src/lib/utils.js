// Utility function to merge Tailwind CSS class names
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

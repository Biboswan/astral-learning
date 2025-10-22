import { useRouter } from 'next/navigation';

export function useRefreshOnNavigation() {
  const router = useRouter();

  const navigateWithRefresh = (path: string) => {
    router.push(path);
    router.refresh(); // Forces fresh server render
  };

  return { navigateWithRefresh };
}

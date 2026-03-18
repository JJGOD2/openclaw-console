"use client";
// components/ui/LocaleSwitcher.tsx
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, localeNames } from "@/i18n/config";

export function LocaleSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    // Strip current locale prefix (if any) and prepend new one
    const pathWithoutLocale = pathname.replace(/^\/(zh-TW|en)/, "") || "/";
    const newPath = next === "zh-TW"
      ? pathWithoutLocale
      : `/${next}${pathWithoutLocale}`;
    router.push(newPath);
  }

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[12px] text-gray-700 cursor-pointer"
      aria-label="Language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}

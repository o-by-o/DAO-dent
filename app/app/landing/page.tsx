import type { Metadata } from "next"

/**
 * Тот же лендинг, что и на «/», по адресу /landing — для демо клиенту на проде
 * (https://dibinterfarm.ru/landing) без отдельной настройки nginx.
 */
export { default } from "../page"

export const metadata: Metadata = {
  title: "DIB Academy — лендинг (превью)",
  description:
    "Профессиональная корейская косметика, обучение косметологов и AI-диагностика кожи. DIB-INTERFARM — ваш проводник в индустрию красоты.",
}

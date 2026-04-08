/**
 * Шаблоны электронной медицинской карты (ЭМК)
 * По требованиям ФЗ-323 «Об основах охраны здоровья граждан в РФ»
 *
 * Генерирует HTML-документы для печати:
 * - Информированное согласие на медицинское вмешательство
 * - Согласие на обработку персональных данных (ФЗ-152)
 * - Выписка из медицинской карты
 * - Направление на рентгенологическое исследование
 * - Справка о проведённом лечении
 */

type PatientData = {
  firstName: string
  lastName: string
  middleName?: string | null
  birthDate?: string | null
  phone: string
  address?: string | null
  passportData?: string | null
}

type DoctorData = {
  name: string | null
  specialization?: string | null
}

const CLINIC_INFO = {
  name: 'ООО «ДаоДент»',
  fullName: 'Общество с ограниченной ответственностью «ДаоДент»',
  address: 'г. Москва, ул. Семёновская',
  license: 'Лицензия на осуществление медицинской деятельности №__________',
  phone: '+7 (495) 000-00-00',
  inn: '__________',
  ogrn: '__________',
}

function formatDate(date?: string | Date | null): string {
  if (!date) return '«___» ____________ 20___ г.'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) + ' г.'
}

function fullName(p: PatientData): string {
  return `${p.lastName} ${p.firstName} ${p.middleName || ''}`.trim()
}

const CSS = `
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; margin: 40px; color: #000; }
    h1 { font-size: 16px; text-align: center; margin-bottom: 20px; }
    h2 { font-size: 14px; margin-top: 15px; }
    .header { text-align: center; margin-bottom: 30px; font-size: 12px; }
    .field { border-bottom: 1px solid #000; min-width: 200px; display: inline-block; }
    .signature-block { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; text-align: center; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    td, th { border: 1px solid #000; padding: 6px 10px; text-align: left; }
    .no-print { display: none; }
    @media print { .no-print { display: none; } body { margin: 20px; } }
    @page { margin: 2cm; }
  </style>
`

/**
 * Информированное добровольное согласие на медицинское вмешательство
 * (ст. 20 ФЗ-323)
 */
export function generateConsentForm(patient: PatientData, doctor: DoctorData, procedures: string[]): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Согласие на медицинское вмешательство</title>${CSS}</head><body>
    <div class="header">
      <strong>${CLINIC_INFO.fullName}</strong><br>
      ${CLINIC_INFO.address} | ${CLINIC_INFO.phone}<br>
      ${CLINIC_INFO.license}
    </div>

    <h1>ИНФОРМИРОВАННОЕ ДОБРОВОЛЬНОЕ СОГЛАСИЕ<br>НА МЕДИЦИНСКОЕ ВМЕШАТЕЛЬСТВО</h1>

    <p>Я, <strong>${fullName(patient)}</strong>,
    ${patient.birthDate ? `дата рождения: ${formatDate(patient.birthDate)},` : ''}
    ${patient.passportData ? `паспорт: ${patient.passportData},` : ''}
    </p>

    <p>добровольно даю согласие на проведение следующих медицинских вмешательств
    в ${CLINIC_INFO.name}:</p>

    <ul>
      ${procedures.map((p) => `<li>${p}</li>`).join('\n      ')}
    </ul>

    <p>Мне в доступной для понимания форме разъяснены:</p>
    <ul>
      <li>цели, методы оказания медицинской помощи, связанный с ними риск;</li>
      <li>возможные варианты медицинского вмешательства;</li>
      <li>последствия медицинского вмешательства;</li>
      <li>предполагаемые результаты оказания медицинской помощи.</li>
    </ul>

    <p>Мне разъяснено право отказаться от медицинского вмешательства
    (ст. 20 Федерального закона от 21.11.2011 № 323-ФЗ).</p>

    <p>Лечащий врач: <strong>${doctor.name}</strong>
    ${doctor.specialization ? `(${doctor.specialization})` : ''}</p>

    <div class="signature-block">
      <div>
        Пациент: <span class="signature-line"></span><br>
        <small>(подпись)</small><br>
        Дата: ${formatDate(new Date())}
      </div>
      <div>
        Врач: <span class="signature-line"></span><br>
        <small>(подпись)</small><br>
        Дата: ${formatDate(new Date())}
      </div>
    </div>
  </body></html>`
}

/**
 * Согласие на обработку персональных данных (ФЗ-152)
 */
export function generatePersonalDataConsent(patient: PatientData): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Согласие на обработку ПД</title>${CSS}</head><body>
    <div class="header">
      <strong>${CLINIC_INFO.fullName}</strong><br>
      ${CLINIC_INFO.address} | ИНН: ${CLINIC_INFO.inn}
    </div>

    <h1>СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ</h1>

    <p>Я, <strong>${fullName(patient)}</strong>,
    ${patient.birthDate ? `дата рождения: ${formatDate(patient.birthDate)},` : ''}
    зарегистрированный(ая) по адресу: ${patient.address || '___________________________'},
    </p>

    <p>в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»
    даю согласие ${CLINIC_INFO.fullName} (далее — Оператор) на обработку моих персональных данных:</p>

    <ul>
      <li>ФИО, дата рождения, пол</li>
      <li>Паспортные данные</li>
      <li>Адрес регистрации и проживания</li>
      <li>Контактные данные (телефон, email)</li>
      <li>Данные полиса ОМС/ДМС</li>
      <li>Медицинские данные (диагнозы, результаты обследований, данные о лечении)</li>
    </ul>

    <p>Цели обработки: оказание медицинской помощи, ведение медицинской документации,
    информирование о записях и услугах.</p>

    <p>Согласие действует до его отзыва в письменной форме.</p>

    <div class="signature-block">
      <div>
        Пациент: <span class="signature-line"></span><br>
        <small>${fullName(patient)}</small><br>
        Дата: ${formatDate(new Date())}
      </div>
    </div>
  </body></html>`
}

/**
 * Выписка из медицинской карты
 */
export function generateMedicalExtract(
  patient: PatientData,
  doctor: DoctorData,
  records: Array<{ date: string; diagnosis: string; treatment: string }>,
): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Выписка</title>${CSS}</head><body>
    <div class="header">
      <strong>${CLINIC_INFO.fullName}</strong><br>
      ${CLINIC_INFO.address} | ${CLINIC_INFO.license}
    </div>

    <h1>ВЫПИСКА ИЗ МЕДИЦИНСКОЙ КАРТЫ СТОМАТОЛОГИЧЕСКОГО БОЛЬНОГО</h1>

    <table>
      <tr><td width="30%"><strong>Пациент</strong></td><td>${fullName(patient)}</td></tr>
      <tr><td><strong>Дата рождения</strong></td><td>${formatDate(patient.birthDate)}</td></tr>
      <tr><td><strong>Телефон</strong></td><td>${patient.phone}</td></tr>
      <tr><td><strong>Лечащий врач</strong></td><td>${doctor.name} ${doctor.specialization ? `(${doctor.specialization})` : ''}</td></tr>
    </table>

    <h2>Проведённое лечение:</h2>
    <table>
      <tr><th>Дата</th><th>Диагноз</th><th>Проведённое лечение</th></tr>
      ${records.map((r) => `
        <tr>
          <td>${formatDate(r.date)}</td>
          <td>${r.diagnosis}</td>
          <td>${r.treatment}</td>
        </tr>
      `).join('')}
    </table>

    <div class="signature-block">
      <div>
        Лечащий врач: <span class="signature-line"></span> / ${doctor.name}<br>
        Дата выдачи: ${formatDate(new Date())}
      </div>
      <div>
        М.П.
      </div>
    </div>
  </body></html>`
}

/**
 * Справка о проведённом лечении
 */
export function generateTreatmentCertificate(
  patient: PatientData,
  doctor: DoctorData,
  diagnosis: string,
  treatment: string,
  dateFrom: string,
  dateTo: string,
): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Справка</title>${CSS}</head><body>
    <div class="header">
      <strong>${CLINIC_INFO.fullName}</strong><br>
      ${CLINIC_INFO.address} | ${CLINIC_INFO.license}
    </div>

    <h1>СПРАВКА</h1>

    <p>Дана <strong>${fullName(patient)}</strong>,
    ${patient.birthDate ? `${formatDate(patient.birthDate)} года рождения,` : ''}
    в том, что он(а) находился(ась) на лечении в ${CLINIC_INFO.name}
    с ${formatDate(dateFrom)} по ${formatDate(dateTo)}.</p>

    <p><strong>Диагноз:</strong> ${diagnosis}</p>
    <p><strong>Проведённое лечение:</strong> ${treatment}</p>

    <div class="signature-block">
      <div>
        Врач: <span class="signature-line"></span> / ${doctor.name}<br>
        Дата: ${formatDate(new Date())}
      </div>
      <div>
        М.П.
      </div>
    </div>
  </body></html>`
}

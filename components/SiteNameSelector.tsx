'use client';

import { useState } from 'react';

export const JOB_SITE_PRESETS = [
  'マイナビ転職',
  'doda',
  'リクナビNEXT',
  'リクルートエージェント',
  'Indeed',
  '転職会議',
  'OpenWork',
  'Wantedly',
  'Green',
  'ビズリーチ',
  'その他',
];

interface SiteNameSelectorProps {
  defaultValue?: string | null;
  className?: string;
  onChangeSiteName?: (value: string) => void;
}

export function SiteNameSelector({ defaultValue, className, onChangeSiteName }: SiteNameSelectorProps) {
  const isPreset = !defaultValue || JOB_SITE_PRESETS.includes(defaultValue);
  const [selected, setSelected] = useState(
    isPreset ? (defaultValue ?? '') : 'その他'
  );
  const [otherValue, setOtherValue] = useState(isPreset ? '' : (defaultValue ?? ''));

  return (
    <div className={className}>
      <select
        name="site_name"
        value={selected}
        onChange={e => {
          const val = e.target.value;
          setSelected(val);
          onChangeSiteName?.(val === 'その他' ? otherValue : val);
        }}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">選択してください</option>
        {JOB_SITE_PRESETS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {selected === 'その他' && (
        <input
          name="site_name_other"
          type="text"
          value={otherValue}
          onChange={e => {
            setOtherValue(e.target.value);
            onChangeSiteName?.(e.target.value);
          }}
          maxLength={100}
          placeholder="サイト名を入力"
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

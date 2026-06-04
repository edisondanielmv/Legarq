import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

// 1. Add import
if (!content.includes("import { useNavigate }")) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';"
  );
}

// 2. Add navigate to the component
if (!content.includes("const navigate = useNavigate();")) {
  content = content.replace(
    "export default function FinancialReports() {",
    "export default function FinancialReports() {\n  const navigate = useNavigate();"
  );
}

// 3. Update desktop transaction view in "reportView === 'cashflow'"? Actually wait, let's look at all the places transactions are rendered in the file.
// We can use a regex to match `key={t.id}` and replace it, but we have multiple cases (trs and divs).

// TRs
content = content.replace(
  /<tr key=\{t\.id\} className="hover:bg-gray-50 transition-colors">/g,
  '<tr key={t.id} onClick={() => t.procedureId && navigate(`/dashboard/procedures/${t.procedureId}`)} className={clsx("hover:bg-gray-50 transition-colors", t.procedureId && "cursor-pointer")}>'
);

// Divs in mobile view - "p-3 space-y-2 hover:bg-gray-50 transition-colors"
content = content.replace(
  /<div key=\{t\.id\} className="p-3 space-y-2 hover:bg-gray-50 transition-colors">/g,
  '<div key={t.id} onClick={() => t.procedureId && navigate(`/dashboard/procedures/${t.procedureId}`)} className={clsx("p-3 space-y-2 hover:bg-gray-50 transition-colors", t.procedureId && "cursor-pointer")}>'
);

// Divs in mobile view - "p-3 flex flex-col space-y-1.5 hover:bg-gray-50\/50"
content = content.replace(
  /<div key=\{t\.id\} className="p-3 flex flex-col space-y-1\.5 hover:bg-gray-50\/50">/g,
  '<div key={t.id} onClick={() => t.procedureId && navigate(`/dashboard/procedures/${t.procedureId}`)} className={clsx("p-3 flex flex-col space-y-1.5 hover:bg-gray-50/50", t.procedureId && "cursor-pointer")}>'
);

// Small divs inside procedure lists
content = content.replace(
  /<div key=\{t\.id\} className="flex items-center justify-between text-\[10px\] bg-white border border-gray-100 rounded-md p-1\.5">/g,
  '<div key={t.id} onClick={() => t.procedureId && navigate(`/dashboard/procedures/${t.procedureId}`)} className={clsx("flex items-center justify-between text-[10px] bg-white border border-gray-100 rounded-md p-1.5", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>'
);

content = content.replace(
  /<div key=\{t\.id\} className="flex flex-col bg-white border border-gray-100 rounded-md p-2 space-y-1">/g,
  '<div key={t.id} onClick={() => t.procedureId && navigate(`/dashboard/procedures/${t.procedureId}`)} className={clsx("flex flex-col bg-white border border-gray-100 rounded-md p-2 space-y-1", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>'
);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);

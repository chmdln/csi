import React from 'react';


const ExportButtons: React.FC = () => {
  const downloadFile = async (url: string, filename: string): Promise<void> => {
    try {
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Ошибка при загрузке файла: ${response.statusText}`);
      }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link); // обязательно для Firefox
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Ошибка при загрузке файла');
    }
  };

  return (
    <div className="flex gap-4 my-4">
      <button
        onClick={() => downloadFile('http://localhost:8000/export/excel', 'parts.xlsx')}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Сохранить в Excel
      </button>
      <button
        onClick={() => downloadFile('http://localhost:8000/export/pdf', 'parts.pdf')}
        className="px-4 py-2 bg-[#E10000] text-white rounded"
      >
        Сохранить в PDF
      </button>
    </div>
  );
};

export default ExportButtons;

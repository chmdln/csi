import React, { useEffect, useState } from 'react';
import PartsList from './components/PartsList';
import AddPartForm from './components/AddPartForm';
import ExportButtons from './components/ExportButtons';

export interface Part {
  id: number;
  name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  parent_id: number | null;
  children: Part[];
}

const App: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch('http://localhost:8000', {
          method: 'GET',
          mode: 'cors',
        });
        if (!response.ok) {
          throw new Error(`Ошибка загрузки деталей: ${response.statusText}`);
        }
        const data: Part[] = await response.json();
        setParts(data);
      } catch (error) {
        console.error('Fetch parts error:', error);
        alert('Не удалось загрузить данные деталей');
      }
    };

    fetchParts();
  }, []);

  return (
    <div className="pt-10 px-20">
      <h1 className="text-2xl text-center font-bold mb-16">Информация о деталях</h1>
      <AddPartForm setParts={setParts} />
      <PartsList parts={parts} setParts={setParts} />
      <ExportButtons />
    </div>
  );
};

export default App;


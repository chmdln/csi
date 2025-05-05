import React, { useState } from 'react';

interface Part {
  id: number;
  name: string;
  unit_price: number;
  quantity: number;
  parent_id: number | null;
  total_price: number;
  children: Part[];
}

interface AddPartFormProps {
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
}

const AddPartForm: React.FC<AddPartFormProps> = ({ setParts }) => {
  const [partName, setPartName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newPart = { 
      name: partName, 
      unit_price: parseInt(unitPrice, 10),
      quantity: parseInt(quantity, 10), 
      parent_id: null 
    };

    const response = await fetch('http://localhost:8000/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPart),
    });

    setPartName('');
    setUnitPrice('');
    setQuantity('');

    if (!response.ok) {
      const err = await response.json();
      alert(err.detail || 'Ошибка при добавлении детали');
      return;
    }

    const data = await response.json();
    setParts(prevParts => [...prevParts, data]);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input 
        className="mb-4 mr-2 px-4 py-2 border-1 border-stone-400"
        type="text" 
        placeholder="Наименование детали" 
        value={partName} 
        onChange={(e) => setPartName(e.target.value)} 
        required 
      />
      
      <input 
        className="mb-4 mr-2 px-4 py-2 border-1 border-stone-400" 
        type="number" 
        value={unitPrice} 
        min="0"
        placeholder="Цена" 
        onChange={(e) => setUnitPrice(e.target.value)} 
        required 
      />

      <input 
        className="mb-4 mr-2 px-4 py-2 border-1 border-stone-400"
        type="number" 
        placeholder="Количество" 
        value={quantity} 
        min="1"
        onChange={(e) => setQuantity(e.target.value)} 
        required 
      />

      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
        type="submit" 
      >
          Добавить деталь
      </button>
    </form>
  );
};

export default AddPartForm;

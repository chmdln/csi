import React, { useState } from 'react'



interface Part {
  id: number;
  name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  parent_id: number | null;
  children: Part[];
}

interface PartItemProps {
  part: Part;
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  prefix: string;
}

const PartItem: React.FC<PartItemProps> = ({ part, setParts, prefix }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    unit_price: '',
    quantity: '',
  });

  const handleAdd = async () => {
    if (!newPart.name || !newPart.unit_price || !newPart.quantity) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    const response = await fetch('http://localhost:8000/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...newPart, 
        unit_price: Number(newPart.unit_price),
        quantity: Number(newPart.quantity),
        parent_id: part.id 
      }),
    });

    if (response.ok) {
      const updatedParts = await fetch('http://localhost:8000/').then(res => res.json());
      setParts(updatedParts);
      setIsAdding(false);
      setNewPart({ name: '', unit_price: '', quantity: '' });
    } else {
      const err = await response.json();
      alert(err.detail || 'Ошибка при добавлении детали');
    }
  };

  const handleDelete = async () => {
    const response = await fetch(`http://localhost:8000/${part.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      const updatedParts = await fetch('http://localhost:8000/').then(res => res.json());
      setParts(updatedParts);
    } else {
      const err = await response.json();
      alert(err.detail || 'Ошибка при удалении детали');
    }
  };

  return (
    <div>
      <div className="flex items-center border-l border-b border-r border-stone-400">
        <div className="flex-1 p-2 font-semibold">{prefix}. {part.name}</div>
        <div className="w-24 p-2">{part.unit_price}</div>
        <div className="w-28 p-2">{part.quantity}</div>
        <div className="w-32 p-2">{part.total_price}</div>
        <div className="flex gap-2 w-60 p-2 flex-wrap">
          <button 
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded">
              Добавить
          </button>
          <button 
            onClick={handleDelete}
            className="px-3 py-1 bg-rose-700 text-white rounded">
              Удалить
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="flex flex-wrap items-center">
          <input 
            className="mt-2 mr-2 px-4 py-2 border-1 border-stone-400 bg-blue-100"
            type="text"
            value={newPart.name}
            onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))}
            placeholder="Наименование детали"
          />
          <input
            className="mt-2 mr-2 px-4 py-2 border-1 border-stone-400 bg-blue-100"
            type="number"
            value={newPart.unit_price}
            min={0}
            onChange={e => setNewPart(p => ({ ...p, unit_price: e.target.value }))}
            placeholder="Цена"
          />
          <input
            className="mt-2 mr-2 px-4 py-2 border-1 border-stone-400 bg-blue-100"
            type="number"
            value={newPart.quantity}
            min={1}
            onChange={e => setNewPart(p => ({ ...p, quantity: e.target.value }))}
            placeholder="Количество"
          />
          <button 
            className="mt-2 mr-2 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleAdd}
          >
            Сохранить
          </button>
          <button 
            onClick={() => setIsAdding(false)}
            className="mt-2 px-4 py-2 bg-rose-700 text-white rounded"
          >
            Отмена
          </button>
        </div>
      )}

      {part.children && (
        <div>
          {part.children.map((child, index) => (
            <PartItem 
              key={child.id} 
              part={child} 
              setParts={setParts} 
              prefix={`${prefix}.${index + 1}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PartItem;

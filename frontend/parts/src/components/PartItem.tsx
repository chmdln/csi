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

  const [isEditing, setIsEditing] = useState(false);
  const [editPart, setEditPart] = useState({
    name: part.name,
    unit_price: part.unit_price.toString(),
    quantity: part.quantity.toString(),
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



  const handleEdit = async () => {
    if (!editPart.name || !editPart.unit_price || !editPart.quantity) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
  
    const response = await fetch(`http://localhost:8000/${part.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editPart.name,
        unit_price: Number(editPart.unit_price),
        quantity: Number(editPart.quantity),
        parent_id: part.parent_id,
      }),
    });
  
    if (response.ok) {
      const updatedParts = await fetch('http://localhost:8000/').then(res => res.json());
      setParts(updatedParts);
      setIsEditing(false);
    } else {
      const err = await response.json();
      alert(err.detail || 'Ошибка при редактировании детали');
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
      <div className="flex flex-wrap items-center border-l border-b border-r border-stone-400">
        <div className="flex-1 p-2 font-semibold">{prefix}. {part.name}</div>
        <div className="w-24 p-2">{part.unit_price}</div>
        <div className="w-28 p-2">{part.quantity}</div>
        <div className="w-32 p-2">{part.total_price}</div>
        <div className="flex gap-2 w-90 p-2 flex-wrap">
          <button 
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded">
              Добавить
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-amber-400 text-white rounded">
              Редактировать
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
            min="0"
            onChange={e => {
              const value = Number(e.target.value);
              if (value >= 0) {  // allow empty input too
                setNewPart(p => ({ ...p, unit_price: e.target.value }));
              }
            }}
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

      {isEditing && (
        <div className="flex flex-wrap items-center">
          <input 
            className="mt-2 mr-2 px-4 py-2 border-1 border-stone-400 bg-amber-100"
            type="text"
            value={editPart.name}
            onChange={e => setEditPart(p => ({ ...p, name: e.target.value }))}
            placeholder="Наименование детали"
          />
          <input
            className="mt-2 mr-2 px-4 py-2 border-1 border-stone-400 bg-amber-100"
            type="number"
            value={editPart.unit_price}
            min={0}
            onChange={e => setEditPart(p => ({ ...p, unit_price: e.target.value }))}
            placeholder="Цена"
          />
          <input
            className="mt-2 mr-2 px-4 py-2 border-1 border-stone-400 bg-amber-100"
            type="number"
            value={editPart.quantity}
            min={1}
            onChange={e => setEditPart(p => ({ ...p, quantity: e.target.value }))}
            placeholder="Количество"
          />
          <button 
            className="mt-2 mr-2 px-4 py-2 bg-amber-500 text-white rounded"
            onClick={handleEdit}
          >
            Сохранить
          </button>
          <button 
            onClick={() => setIsEditing(false)}
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

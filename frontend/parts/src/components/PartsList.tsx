import React from 'react';
import PartItem from './PartItem';
import TableHeader from './TableHeader';

interface Part {
  id: number;
  name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  parent_id: number | null;
  children: Part[];
}

interface PartsListProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
}

const PartsList: React.FC<PartsListProps> = ({ parts, setParts }) => {
  return (
    <div>
      <TableHeader />
      {parts.map((part, index) => (
        <PartItem key={part.id} part={part} setParts={setParts} prefix={`${index + 1}`} />
      ))}
    </div>
  );
};

export default PartsList;


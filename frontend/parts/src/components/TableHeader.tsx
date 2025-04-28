import React from 'react';

const TableHeader: React.FC = () => {
    return (
        <div className="flex flex-wrap items-center border-1 border-stone-400 font-bold">
            <div className="flex-1 p-2">Наименование детали</div>
            <div className="w-24  p-2">Цена</div>
            <div className="w-28  p-2">Количество</div>
            <div className="w-32  p-2">Стоимость</div>
            <div className="w-60  p-2">Действия</div>
        </div>
    );
}
export default TableHeader;
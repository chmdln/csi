from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
import pandas as pd
import io
import os

from enums import DeletePartResult
from utils import flattern_parts
from database import crud
from database.database import get_db
from schemas import (
    PartCreate,
    PartOut
)



router = APIRouter(tags=["Parts"])


@router.get("/", status_code=status.HTTP_200_OK, response_model=List[PartOut])
def get_all_parts(db: Session = Depends(get_db)):
    """
    Получить все детали в виде иерархического дерева.

    Этот эндпоинт извлекает все детали из базы данных и возвращает их в виде дерева,
    где детали без родителя находятся на верхнем уровне, а каждая деталь может иметь
    вложенные дочерние элементы.

    Аргументы:
        db (Session): Сессия базы данных, предоставляемая зависимостью.

    Возвращает:
        List[PartOut]: Список всех деталей в иерархической структуре.
    """

    try:
        return crud.get_tree(db)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Ошибка сервера при получении данных с базы данных"
        )
    

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PartOut)
def create_part(part: PartCreate, db: Session = Depends(get_db)):
    """
    Создать новую деталь.

    Этот эндпоинт создаёт новую деталь в базе данных.
    Он проверяет, существует ли уже деталь с таким же именем (без учёта регистра)
    и тем же parent_id. Иначе создаёт новую запись, сохраняет её в базе, обновляет цены родительской детали (если она есть) и возвращает объект созданной детали.

    Аргументы:
        part (PartCreate): Данные создаваемой детали.
        db (Session): Сессия базы данных, предоставляемая зависимостью.

    Возвращает:
        PartOut: Объект созданной детали.
    """
    try: 
        new_part = crud.create_part(db, part)
    except SQLAlchemyError: 
        raise HTTPException(
            status_code=500,
            detail="Ошибка сервера при создании детали"
        )
    
    if new_part == DeletePartResult.EXISTS:
        raise HTTPException(
            status_code=400, 
            detail="Деталь с таким именем уже существует"
        )
    
    total_price = new_part.unit_price * new_part.quantity
    return PartOut(
            id=new_part.id,
            name=new_part.name,
            unit_price=new_part.unit_price,
            quantity=new_part.quantity,
            parent_id=new_part.parent_id,
            total_price=total_price,
            children=[]
        ) 


@router.delete("/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_part(part_id: int, db: Session = Depends(get_db)):
    """
    Удалить деталь.

    Проверяет наличие детали и наличие дочерних элементов.
    Если деталь существует и не имеет дочерних элементов, удаляет её из базы данных
    и обновляет цену родительской детали.

    Аргументы:
        part_id (int): Идентификатор детали для удаления.
        db (Session): Сессия базы данных, предоставляемая зависимостью.

    Возвращает:
        204 No Content, если удаление прошло успешно
        404 Not Found, если деталь не найдена
        400 Bad Request, если деталь имеет дочерние элементы
    """
    try: 
        result = crud.delete_part(db, part_id)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Ошибка сервера при удалении детали"
        )
    
    if result == DeletePartResult.NOT_FOUND: 
        raise HTTPException(
            status_code=404, 
            detail="Деталь не найдена"
        )
    if result == DeletePartResult.HAS_CHILDREN:
        raise HTTPException(
            status_code=400, 
            detail="Невозможно удалить деталь с дочерними элементами"
        )



@router.get("/export/excel", status_code=status.HTTP_200_OK)
def export_excel(db: Session = Depends(get_db)):
    """
    Экспортировать все детали в Excel файл.

    Извлекает все детали из базы данных, строит иерархическую структуру
    и экспортирует её в Excel файл.

    Возвращает:
        StreamingResponse: Excel файл с экспортированными данными
    """
    try: 
        parts = crud.get_tree(db)
        rows = flattern_parts(parts)
        df = pd.DataFrame(rows)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Parts")

        output.seek(0)
        return StreamingResponse(
            output, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=parts.xlsx"}
        )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Ошибка сервера при экспорте данных в Excel"
        )


@router.get("/export/pdf", status_code=status.HTTP_200_OK)
def export_pdf(db: Session = Depends(get_db)):
    """
    Экспортировать все детали в PDF файл.

    Извлекает все детали из базы данных, строит иерархическую структуру
    и экспортирует её в PDF файл.

    Возвращает:
        StreamingResponse: PDF файл с экспортированными данными
    """
    try: 
        parts = crud.get_tree(db)
        rows = flattern_parts(parts)

        header = ["Наименование", "Цена", "Количество", "Стоимость"]
        data = [header] + [[
            row["Наименование"],
            str(row["Цена"]),
            str(row["Количество"]),
            str(row["Стоимость"])
        ] for row in rows]

        font_path = os.path.join("static", "fonts", "DejaVuSans-Bold.ttf")
        pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", font_path))

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)

        style = ParagraphStyle(
            name="DejaVuStyle",
            fontName="DejaVuSans-Bold",
            fontSize=10,
        )

        formatted_data = [
            [Paragraph(cell, style) for cell in row]
            for row in data
        ]
        
        table = Table(formatted_data, repeatRows=1)
        table.setStyle(TableStyle([
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.black),
            ("ALIGN",      (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME",   (0, 0), (-1, 0), "DejaVuSans-Bold"),
            ("FONTSIZE",   (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("GRID",       (0, 0), (-1, -1), 0.5, colors.black),
        ]))

        doc.build([table])
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=parts_table.pdf"},
        )
    
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Ошибка сервера при экспорте данных в PDF"
        )

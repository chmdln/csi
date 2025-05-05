from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from utils import update_parent_prices
from enums import DeletePartResult
from .models import Part
from schemas import PartCreate, PartUpdate



def create_part(db: Session, existing_part: PartCreate):
    """
    Создать новую деталь в базе данных.

    Проверяет, существует ли уже деталь с таким же именем (без учёта регистра)
    и тем же parent_id. Иначе создаёт новую запись, сохраняет её в базе, обновляет цены родительской детали (если она есть) и возвращает объект созданной детали.

    Аргументы:
        db (Session): Сессия базы данных для выполнения операций.
        existing_part (PartCreate): Данные создаваемой детали

    Возвращает:
        Part: Объект созданной детали при успешном сохранении.
        DeletePartResult.EXISTS: Если деталь с тем же именем и parent_id уже имеется в базе.
    """

    existing_part = db.query(Part).filter(
        func.lower(Part.name) == existing_part.name.lower(),
        Part.parent_id == existing_part.parent_id
    ).first()
    if existing_part:
        return DeletePartResult.EXISTS 
    
    try: 
        db_part = Part(**existing_part.model_dump())
        db_part.name = db_part.name.capitalize()
        db.add(db_part)
        db.commit()
        db.refresh(db_part)

        if db_part.parent_id:
            update_parent_prices(db, db_part.parent_id)
        return db_part
    except SQLAlchemyError as e:
        db.rollback()  
        raise e  
    



def edit_part(db: Session, part_id: int, part_update: PartUpdate):
    """
    Редактировать существующую деталь.

    Проверяет наличие детали. Если деталь найдена — обновляет указанные поля,
    сохраняет изменения и обновляет цены родительской детали (если нужно).

    Аргументы:
        db (Session): Сессия базы данных.
        part_id (int): Идентификатор детали для обновления.
        part_update (PartUpdate): Данные для обновления.

    Возвращает:
        Part: Обновлённый объект детали.
        None: Если деталь не найдена.
    """
    existing_part = db.query(Part).get(part_id)
    if not existing_part:
        return DeletePartResult.NOT_FOUND

    for field, value in part_update.model_dump(exclude_unset=True).items():
        setattr(existing_part, field, value)

    if part_update.name is not None:
        existing_part.name = existing_part.name.capitalize()

    try:
        db.commit()
        db.refresh(existing_part)

        if existing_part.parent_id:
            update_parent_prices(db, existing_part.parent_id)
        return existing_part
    except SQLAlchemyError as e:
        db.rollback()
        raise e



def delete_part(db: Session, part_id: int):
    """
    Удалить деталь по идентификатору.

    Проверяет наличие детали и наличие дочерних элементов.
    Если деталь существует и не имеет дочерних элементов, удаляет её из базы данных
    и обновляет цену родительской детали.

    Аргументы:
        db (Session): Сессия базы данных.
        part_id (int): Идентификатор детали для удаления.

    Возвращает:
        DeletePartResult: Результат удаления (успех, не найдено, есть дочерние элементы).
    """
    existing_part = db.query(Part).get(part_id)
    if not existing_part:
        return DeletePartResult.NOT_FOUND
    if existing_part.children:
        return DeletePartResult.HAS_CHILDREN

    try:
        parent_id = existing_part.parent_id
        db.delete(existing_part)
        db.commit()
        if parent_id:
            update_parent_prices(db, parent_id)
        return DeletePartResult.SUCCESS
    except SQLAlchemyError as e:
        db.rollback()  
        raise e


def get_tree(db: Session):
    """
    Получить все детали в виде дерева.

    Извлекает все корневые детали (без родителя) и строит
    иерархическую структуру с дочерними элементами.

    Аргументы:
        db (Session): Сессия базы данных.

    Возвращает:
        List[dict]: Список деталей в виде дерева.
    """
    try: 
        root_parts = db.query(Part).filter(Part.parent_id == None).all()
        return [build_tree(existing_part) for existing_part in root_parts]
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def build_tree(existing_part):
    """
    Построить рекурсивное дерево детали.

    Рекурсивно собирает данные о детали и её дочерних элементах
    в виде вложенного словаря.

    Аргументы:
        existing_part (Part): Экземпляр детали.

    Возвращает:
        dict: Словарь с данными детали и её потомков.
    """
    total = existing_part.unit_price * existing_part.quantity
    children = [build_tree(child) for child in existing_part.children]

    return {
        "id": existing_part.id,
        "name": existing_part.name,
        "unit_price": existing_part.unit_price,
        "quantity": existing_part.quantity,
        "parent_id": existing_part.parent_id,
        "total_price": total,
        "children": children
    }



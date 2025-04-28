from database.models import Part

def update_parent_prices(db, parent_id):
    """
    Рекурсивно обновляет цены всех предков детали с указанным parent_id, 
    устанавливая их равными сумме цен за единицу их дочерних деталей.

    :param db: Сессия SQLAlchemy
    :param parent_id: ID детали, предков которой нужно обновить
    """
    while parent_id:
        parent = db.query(Part).get(parent_id)
        new_unit_price = sum(child.unit_price for child in parent.children)
        parent.unit_price = new_unit_price
        db.commit()
        parent_id = parent.parent_id 


def flattern_parts(parts):
    """
    Преобразует иерархическую структуру деталей в плоский список строк.

    Аргументы:
        parts (list): Список деталей в виде иерархического дерева.

    Возвращает:
        list: Плоский список словарей, представляющих детали и их свойства, 
              включая наименование, цену, количество и стоимость, с иерархической нумерацией.
    """
    rows = []

    def traverse(part, prefix=""):
        rows.append({
            "Наименование": str(prefix + ". " + part["name"]),
            "Цена": part["unit_price"],
            "Количество": part["quantity"],
            "Стоимость": part["total_price"],
        })
        for idx, child in enumerate(part.get("children", []), start=1):
            child_prefix = f"{prefix}.{idx}" if prefix else f"{idx}"
            traverse(child, prefix=child_prefix)

    for idx, part in enumerate(parts, start=1):
        traverse(part, prefix=f"{idx}")
    return rows
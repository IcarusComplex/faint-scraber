SELECT iss.itemId, iss.itemName, iss.iconName, iss.rarity, iss.slotName, iss.typeName, iloc.location
    FROM item_stats AS iss
        LEFT JOIN item_locations as iloc
            ON iss.itemId = iloc.itemId

// services/inventory.service.js

import InventoryItem from "../../model/items/item.model.js";

export async function createInventoryItem(data) {
  const item = await InventoryItem.findOne({name : data.name });
  if (item){
    item.quantity += data.quantity;
    await item.save();
    return item.toJSON();
  }
  const created = await InventoryItem.create(data);
  return created.toJSON();
}

//
// 🔹 Get by ID
//
export async function getInventoryItemById(id, { populateUser = false } = {}) {
  try{
    let query = await InventoryItem.findById(id);
    return query;
  }
  catch(err){
    return null
  }
}

//  Search / List
export async function getAllItemsService (){
  try {
    const items = await InventoryItem.find({});
    
   return {
    items
  }
  }
  catch(err){
    return null;
  }
}
export async function searchInventoryItems({
  q = "",          // search string
  page = 1,
  limit = 10,
  sortBy = "updatedAt",
  sortOrder = "desc",
  populateUser = false,
} = {}) {
  // default filter
  let filter = {};

  // if search string provided -> search by name (case-insensitive)
  if (q.trim() !== "") {
    filter.name = { $regex: q.trim(), $options: "i" };
  }

  // Sorting
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // If no search string, only show last updated 5 items
  let skip = 0;
  let effectiveLimit = limit;

  if (q.trim() === "") {
    // override limit to 5
    effectiveLimit = 5;
    // always first page for "latest 5"
    skip = 0;
  } else {
    skip = (page - 1) * limit;
  }

  // build query
  let query = InventoryItem.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(effectiveLimit);

  if (populateUser) query = query.populate("user");

  // run queries
  const [items, total] = await Promise.all([
    query.lean({ virtuals: true }),
    InventoryItem.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: q.trim() === "" ? 1 : page,
    pages: q.trim() === "" ? 1 : Math.ceil(total / limit),
  };
}


//
// 🔹 Update
//
export async function updateInventoryItem(id, updates) {
  return InventoryItem.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean({ virtuals: true });
}

//
// 🔹 Delete
//
export async function deleteInventoryItem(id) {
  return InventoryItem.findByIdAndDelete(id).lean({ virtuals: true });
}

/** The element with this id, checked to be of the expected type. */
export const byId = <T extends HTMLElement>(id: string, type: new () => T): T => {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`#${id} is missing or is not a ${type.name}`);
  return element;
};

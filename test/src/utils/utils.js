// const handleErrors = (response) => {
//   if (!response.ok) throw Error(response.statusText);
//   return response.json();
// }
const handleErrors = (response) => {
  if (!response.ok) return (response.statusText);
  return response.json();
}

export const fetchRequest = (url, options, callback) => {
  fetch(url, options)
    .then(handleErrors)
    .then(response => callback(response))
    .catch(error => console.log(error));
}

export const deleteNode = (nid, token, callback) => {
  const fetchOptions = {
    method: 'DELETE',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token
    }),
  };
  fetch(`https://dev-expenses-api.pantheonsite.io/node/${nid}?_format=json`, fetchOptions)
    .then(response => {
      callback(response);
    });
}

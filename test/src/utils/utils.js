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

export const fetchData = (token, dataDispatch) => {
  const fetchOptions = {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token
    }),
  };
  fetchRequest('https://dev-expenses-api.pantheonsite.io/user-expenses?_format=json', fetchOptions, (data) => {
    let groupedData = {};
    let monthsTotals = {};
    data.forEach(item => {
      const date = new Date(item.field_date);
      const month = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      if (!groupedData[month]) {
        groupedData[month] = [];
      }
      if (!monthsTotals[month]) {
        monthsTotals[month] = 0;
      }
      groupedData[month].push(item);
      monthsTotals[month] += parseInt(item.field_amount);
    });
    dataDispatch({ type: 'SET_DATA', raw: data, groupedData: groupedData, totals: monthsTotals });
  });
}

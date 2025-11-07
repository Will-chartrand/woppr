const wireUpButtons = () => {

  for(const elem of document.getElementsByClassName('plugin-option')){
    let selectionButton = elem;
    
    console.log(elem);

    selectionButton.addEventListener('click', function() {

      var _myreq = {
        data: selectionButton.innerHTML
      }

      console.log(selectionButton.innerHTML + " poops");
      window.api.send('select-plugin', _myreq);
      console.log("we pressed the button");
    });
  }
}

const createPluginCards = (pluginList) => {
  for(const plugin of pluginList){
    document.getElementById("plugin-grid").innerHTML += `<button class="plugin-option">${plugin}</button>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log("we're wiring buttons");

  console.log("plugins:");
  const pluginList = await window.api.getPlugins();

  console.log(pluginList);

  console.log("end plugins");

  createPluginCards(pluginList);

  wireUpButtons();

});


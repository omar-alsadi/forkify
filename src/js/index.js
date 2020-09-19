// Global app controller
import Search from './modules/Search' ;
import Recipe from './modules/Recipe' ;
import List from './modules/List' ;
import Likes from './modules/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView' ;
import * as likesView from './views/likesView' ;
import { elements , renderLoader , clearLoader } from './views/base'


/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */

const state = {};

window.state = state ;


/********************** SEARCH CONTROLLER **********************/

const controlSearch = async () => {
    // 1 - get query from view
    const query = searchView.getInput() ; 



    if(query){
        // 2 - new search object and add to state
        state.search = new Search(query);

        // 3 - Prepare UI for results
        searchView.clearField();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4 - Serach for recipes
            await state.search.getResults();
    
            // 5 - Render results on UI
            clearLoader();
            searchView.renderResult(state.search.result);

        } catch (error) {
            alert(`There is something wrong in controlSearch`);
            clearLoader();
        }

    }

}

elements.searchForm.addEventListener('submit' , e => {
    e.preventDefault();  
    controlSearch();
});



elements.searchResPages.addEventListener('click' , e => {

    const btn = e.target.closest('.btn-inline');

    if(btn){
        const goToPage = parseInt(btn.dataset.goto , 10) ;
        searchView.clearResults();
        searchView.renderResult(state.search.result , goToPage);
        console.log(goToPage) ;
    }
    
})


/********************** RECIPE CONTROLLER **********************/

const controlRecipe = async () => {
    // Get Id from url
    const id = parseInt(window.location.hash.replace('#' ,'')) ;
    console.log(id);

    if(id) {

        // Prepare UI for changes
        recipeView.clearRecipe();

        renderLoader(elements.recipe);

        //  Highlight selected search item 
        if(state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);


        try {

            //  Get recipe data and parse Ingredients
    
            await state.recipe.getRecipe() ;

            state.recipe.parseIngredients();

            // Calculate time and servings
            state.recipe.calcTime();
            state.recipe.calcSevings();
    
            // Render recipe

            clearLoader();

            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );


        } catch (error) {
            console.log(`there is someting wrong in controlRecipe ${error}`);         
        }
    }

};




/********************** List CONTROLLER **********************/

const controlList = () => {

    // Create a new empty list if there is no list
    if(!state.list) state.list = new List();

    // Add each ingredient to the list and UI

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count , el.unit , el.ingredient) ;
        listView.renderItem(item);
    });

};

// Handle delete and update list item

elements.shopping.addEventListener('click' , e => {

    const id = e.target.closest('.shopping__item').dataset.itemid ;

    if(e.target.matches('.shopping__delete , .shopping__delete *')) {

        // delete from state
        state.list.deleteItem(id);
    
        // delete from UI
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count--value')) {
        // update value in state
        const val = parseInt(e.target.value) ;
        state.list.updateItem(id , val);
    }

});




/********************** Like CONTROLLER **********************/


const controlLike = () => {

    if(!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id ;

    if(!state.likes.isLiked(currentId)) {

        // Add item liked to state.likes

        const newLike = state.likes.addLike(
            currentId ,
            state.recipe.title ,
            state.recipe.author ,
            state.recipe.img
            );

        // toggle like button

        likesView.toggleLikeBtn(true);

        // Add item liked to UI
        likesView.renderLike(newLike);

    } else {
        // Remove item Liked from state.likes

        state.likes.deleteLike(currentId);

        // toggle like button
        likesView.toggleLikeBtn(false);

        //Remove item liked from UI
        likesView.deleteLike(currentId);

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restore liked recipes on page reload

window.addEventListener('load' , () => {
    
    state.likes = new Likes();
    
    // Restoring likes from localStorage
    state.likes.readStorage();

    // toggle like menu
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


// decrease / increase ingredients by servings count

elements.recipe.addEventListener( 'click' , e => {
    if(e.target.matches('.btn-decrease , .btn-decrease *')) {
    // decrease
    if ( state.recipe.servings > 1){
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe); }
    } else if(e.target.matches('.btn-increase , .btn-increase *')) {
    // increase
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add , .recipe__btn--add *')) {
        controlList();
    } else if (e.target.matches('.recipe__love , .recipe__love *')){
        controlLike();
    }

});


// window.addEventListener('hashchange' , controlRecipe );
// window.addEventListener('load' , controlRecipe );

// make events listner on one line :)

['load' , 'hashchange'].forEach( event => window.addEventListener( event , controlRecipe)) ;


window.l = new List();
/**
 * Created by johan on 2/24/2017.
 */
import { combineReducers } from 'redux'
import { ADD_TODO, TOGGLE_TODO, SET_VISIBILITY_FILTER, VisibilityFilters } from './actions'
import { ADD_OBJECT, REMOVE_OBJECT } from './actions_viz'
const { SHOW_ALL } = VisibilityFilters;

function objects(state = [], action){
    let newState = Object.assign({}, state); //TODO: make deep clone
    switch (action.type) {
        case ADD_OBJECT:
            newState[action.name] = action.objstate;
            return newState;
        case REMOVE_OBJECT:
            delete newState[action.name];
            return newState;
        case UPDATE_OBJECT:
            newState[action.name] = action.objstate;
            return newState;
        default:
            return state;
    }
}


function visibilityFilter(state = SHOW_ALL, action) {
    switch (action.type) {
        case SET_VISIBILITY_FILTER:
            return action.filter;
        default:
            return state
    }
}

function todos(state = [], action) {
    switch (action.type) {
        case ADD_TODO:
            return [
                ...state,
                {
                    text: action.text,
                    completed: false
                }
            ];
        case TOGGLE_TODO:
            return state.map((todo, index) => {
                if (index === action.index) {
                    return Object.assign({}, todo, {
                        completed: !todo.completed
                    })
                }
                return todo
            });
        default:
            return state
    }
}

const objApp = combineReducers({
    objects,
    todos
});

export default objApp

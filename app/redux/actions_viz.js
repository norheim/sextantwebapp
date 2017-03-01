/**
 * Created by johan on 2/24/2017.
 */

/*
 * action types
 */

export const ADD_OBJECT = 'ADD_TODO';
export const REMOVE_OBJECT = 'REMOVE_OBJECT';

/*
 * action creators
 */

export function addObject(objclass, name, objstate) {
    return { type: ADD_OBJECT, objclass, name, objstate }
}

export function updateObject(name, objstate) {
    return { type: UPDATE_OBJECT, name, objstate }
}

export function removeObject(name) {
    return { type: REMOVE_OBJECT, name }
}


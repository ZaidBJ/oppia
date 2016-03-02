// Copyright 2016 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection domain objects.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

// TODO(bhenning): Implement validation functions and related tests.
oppia.factory('CollectionObjectFactory', [
    'CollectionNodeObjectFactory', 'SkillListObjectFactory',
    function(CollectionNodeObjectFactory, SkillListObjectFactory) {
    var Collection = function(collectionBackendObject) {
      this._id = collectionBackendObject.id;
      this._title = collectionBackendObject.title;
      this._objective = collectionBackendObject.objective;
      this._category = collectionBackendObject.category;
      this._version = collectionBackendObject.version;
      this._nodes = [];

      // This map acts a fast way of looking up a collection node for a given
      // exploration ID.
      this._explorationIdToNodeIndexMap = {};
      for (var i = 0; i < collectionBackendObject.nodes.length; i++) {
        this._nodes[i] = CollectionNodeObjectFactory.create(
          collectionBackendObject.nodes[i]);
        var explorationId = this._nodes[i].getExplorationId();
        this._explorationIdToNodeIndexMap[explorationId] = i;
      }
    };

    // Instance methods

    Collection.prototype.getId = function() {
      return this._id;
    };

    Collection.prototype.getTitle = function() {
      return this._title;
    };

    Collection.prototype.setTitle = function(title) {
      this._title = title;
    };

    Collection.prototype.getObjective = function() {
      return this._objective;
    };

    Collection.prototype.setObjective = function(objective) {
      this._objective = objective;
    };

    Collection.prototype.getCategory = function() {
      return this._category;
    };

    Collection.prototype.setCategory = function(category) {
      this._category = category;
    };

    Collection.prototype.getVersion = function() {
      return this._version;
    };

    // Adds a new frontend collection node domain object to this collection.
    // This will return true if the node was successfully added, or false if the
    // given collection node references an exploration ID already referenced by
    // another node within this collection. Changes to the provided object will
    // be reflected in this collection.
    Collection.prototype.addCollectionNode = function(collectionNodeObject) {
      var explorationId = collectionNodeObject.getExplorationId();
      if (!this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
        this._explorationIdToNodeIndexMap[explorationId] = this._nodes.length;
        this._nodes.push(collectionNodeObject);
        return true;
      }
      return false;
    };

    // Attempts to remove a collection node from this collection given the
    // specified exploration ID. Returns whether the collection node was
    // removed, which depends on whether any collection nodes reference the
    // given exploration ID.
    Collection.prototype.deleteCollectionNode = function(explorationId) {
      // TODO(bhenning): Consider whether the removed collection node should be
      // invalidated, leading to errors if its mutated in the future. This might
      // help prevent bugs where collection nodes are stored and changed after
      // being removed from a collection.
      if (this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
        var nodeIndex = this._explorationIdToNodeIndexMap[explorationId];
        delete this._explorationIdToNodeIndexMap[explorationId];
        this._nodes.splice(nodeIndex, 1);

        // Update all node exploration ID map references past the removed index
        // to ensure they are still pointing to correct indexes.
        for (var i = nodeIndex; i < this._nodes.length; i++) {
          var nodeExpId = this._nodes[i].getExplorationId();
          this._explorationIdToNodeIndexMap[nodeExpId] = i;
        }
        return true;
      }
      return false;
    };

    // Returns whether any collection nodes in this collection reference the
    // provided exploration ID.
    Collection.prototype.containsCollectionNode = function(explorationId) {
      return this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId);
    };

    // Returns a collection node given an exploration ID, or undefined if no
    // collection node within this collection references the provided
    // exploration ID.
    Collection.prototype.getCollectionNodeByExplorationId = function(expId) {
      return this._nodes[this._explorationIdToNodeIndexMap[expId]];
    };

    // Returns a list of collection node objects for this collection. Changes to
    // nodes returned by this function will be reflected in the collection.
    // Changes to the list itself will not be reflected in this collection.
    Collection.prototype.getCollectionNodes = function() {
      return angular.copy(this._nodes);
    };

    Collection.prototype.getCollectionNodeCount = function() {
      return this._nodes.length;
    };

    // Returns the reference to the internal nodes array; this function is only
    // meant to be used for Angular bindings and should never be used in code.
    // Please use getCollectionNodes() and related functions, instead. Please
    // also be aware this exposes internal state of the collection domain
    // object, so changes to the array itself may internally break the domain
    // object.
    Collection.prototype.getBindableCollectionNodes = function() {
      return this._nodes;
    };

    // Returns a list of all exploration IDs referenced by this collection.
    // Changes to the list itself will not be reflected in this collection.
    Collection.prototype.getExplorationIds = function() {
      return angular.copy(Object.keys(this._explorationIdToNodeIndexMap));
    };

    // Builds a unique skill list containing all prerequisite and acquired
    // skills from all collections nodes within this domain object. Please note
    // this operation returns a new skill list everytime this function is
    // called.
    Collection.prototype.getSkillList = function() {
      var skillList = SkillListObjectFactory.create([]);
      for (var i = 0; i < this._nodes.length; i++) {
        var collectionNode = this._nodes[i];
        skillList.addSkillsFromSkillList(
          collectionNode.getPrerequisiteSkillList());
        skillList.addSkillsFromSkillList(collectionNode.getAcquiredSkillList());
      }
      return skillList;
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection python dict.
    Collection.create = function(collectionBackendObject) {
      return new Collection(collectionBackendObject);
    };

    return Collection;
  }
]);

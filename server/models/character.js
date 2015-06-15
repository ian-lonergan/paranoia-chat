'use strict';

var Character = function (name, rank, sector, cloneNumber, mutantPower, secretSociety) {
  this.name = name;
  // rank must be in [ROYGBIVU] or null, with null representing INFRARED
  if (rank && rank.match(/^[ROYGBIVU]$/)) {
    this.rank = rank;
  } else {
    this.rank = null;
  }
  if (sector && sector.match(/^[A-Z]{3}$/)) {
    this.sector = sector;
  } else {
    this.sector = 'NLL';
  }
  if (cloneNumber === parseInt(cloneNumber, 10)) {
    this.cloneNumber = cloneNumber;
  } else {
    this.cloneNumber = 0;
  }
  this.mutantPower = mutantPower;
  this.secretSociety = secretSociety;
};

Character.createFromObject = function (object) {
  if (!object) {
    object = {};
  }
    var name = object.name,
        rank = object.rank,
        sector = object.sector,
        cloneNumber = object.cloneNumber,
        mutantPower = object.mutantPower,
        secretSociety = object.secretSociety;

    return new Character(name, rank, sector, cloneNumber, mutantPower, secretSociety);  
};

Character.prototype.get = function () {
  return {
    name: this.name,
    rank: this.rank,
    sector: this.sector,
    cloneNumber: this.cloneNumber,
    mutantPower: this.mutantPower,
    secretSociety: this.secretSociety
  };
};

// expose API
module.exports = Character;
import { Canister, query, update, text, Principal, int64, bool, Void, ic } from 'azle';

// Define global voting item structure
type VotingItem = {
  itemId: text;
  itemName: text;
  options: text[];
  startTime: int64;
  endTime: int64;
  votes: Map<text, int64>;
  canceled: bool;
};

type VotingItemResult = {
  itemId: text;
  votingItem: VotingItem;
};

// Create a map to store voting items
let votingItems = new Map<text, VotingItem>();

export default Canister({
  // Function to cast a vote on a voting item
  castVote: update([text, text], Void, async (itemId, selectedOption) => {
    const verifiedCaller = await ic.caller();
    const votingItem = votingItems.get(itemId);

    if (!votingItem) {
      throw new Error("Voting item not found");
    }

    const currentTime = Date.now() / 1000; //Convert milliseconds to seconds

    if (votingItem.canceled || currentTime < votingItem.startTime || currentTime >= votingItem.endTime) {
      throw new Error("Invalid voting period");
    }

    if (!votingItem.options.includes(selectedOption)) {
      throw new Error("Invalid voting option");
    }

    if (!votingItem.votes.has(verifiedCaller.toText())) {
      votingItem.votes.set(verifiedCaller.toText(), 1);
    } else {
        const currentVoteCount = votingItem.votes.get(verifiedCaller.toText()) || 0;
        votingItem.votes.set(verifiedCaller.toText(), currentVoteCount + 1);
    }

    votingItems.set(itemId, votingItem);
  }),

  // Function to end a voting period for a voting item
  endVoting: update([text], Void, (itemId) => {
    const votingItem = votingItems.get(itemId);

    if (!votingItem) {
      throw new Error("Voting item not found");
    }

    const currentTime = Date.now() / 1000; //Convert milliseconds to seconds

    if (votingItem.canceled || currentTime < votingItem.endTime) {
      throw new Error("Voting period not ended");
    }

    // Add logic here to handle the end of the voting period
  }),

  // Function to cancel a voting item
  cancelVoting: update([text], Void, (itemId) => {
    const votingItem = votingItems.get(itemId);

    if (votingItem) {
      votingItem.canceled = true;
      votingItems.set(itemId, votingItem);
    } else {
      throw new Error("Voting item not found");
    }
  }),

  // Function to create a new voting item
  createVotingItem: update([text, text, text, int64, int64], Void, (itemId, itemName, options, startTime, endTime) => {
    votingItems.set(itemId, {
      itemId: itemId,
      itemName: itemName,
      options: options,
      startTime: startTime,
      endTime: endTime,
      votes: new Map(),
      canceled: false,
    });
  }),

  // Query to get the current votes for a voting item
  getCurrentVotes: query([text], Map<text, int64>, (itemId) => {
    const votingItem = votingItems.get(itemId);

    if (votingItem) {
      return votingItem.votes;
    } else {
      throw new Error("Voting item not found");
    }
  }),

  // Query to check if a voting item is canceled
  isVotingItemCanceled: query([text], bool, (itemId) => {
    const votingItem = votingItems.get(itemId);

    if (votingItem) {
      return votingItem.canceled;
    } else {
      throw new Error("Voting item not found");
    }
  }),
});

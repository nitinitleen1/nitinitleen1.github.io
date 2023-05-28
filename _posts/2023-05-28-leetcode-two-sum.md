---
title: The Two Sum Problem - LeetCode
date: 2023-05-28
description: Exploring the Two Sum problem on LeetCode and providing a solution using Python.
categories:
  - Programming
tags:
  - leetcode
  - python
  - algorithms
---

## The Two Sum Problem

The Two Sum problem is a classic coding question often asked in programming interviews. The problem statement is as follows:

Given an array of integers `nums` and an integer target value `target`, find two numbers in the array that add up to the target and return their indices.

Here's an example to illustrate the problem:

```plaintext
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: The numbers at indices 0 and 1 (2 and 7) add up to 9.
```

## Approach and Solution

To solve the Two Sum problem, we can use a simple approach that utilizes a hashmap to store the complement of each number as we iterate through the array.

Here's the step-by-step solution in Python:

```python
def twoSum(nums, target):
    # Create an empty hashmap
    hashmap = {}

    # Iterate through the array
    for i, num in enumerate(nums):
        # Calculate the complement
        complement = target - num

        # Check if the complement is already in the hashmap
        if complement in hashmap:
            # Return the indices of the two numbers
            return [hashmap[complement], i]

        # Add the current number and its index to the hashmap
        hashmap[num] = i

    # If no solution is found, return an empty list
    return []
```

- We initialize an empty dictionary `num_dict` to store numbers and their indices.
- We iterate through the array using the `enumerate()` function to access both the indices and the corresponding numbers.
- For each number, we calculate its complement by subtracting it from the target.
- We check if the complement exists in `num_dict`. If it does, we have found the two numbers that add up to the target, and we return their indices.
- If the complement is not in `num_dict`, we add the current number and its index to the dictionary for future reference.
- If we exhaust the array without finding a solution, we return an empty list.

Let's test the solution with a sample input:

```python
nums = [2, 7, 11, 15]
target = 9

print(twoSum(nums, target))
```

Output:

```csharp
[0, 1]
```

## Complexity Analysis

The above solution has a time complexity of O(n) since we iterate through the array once. The space complexity is also O(n) since we use a hashmap to store the numbers and their indices.

## Conclusion

Through this blog post, we explored the popular LeetCode problem "Two Sum" and provided a detailed solution using a hash table. The key takeaway from this problem is to leverage data structures effectively to optimize our algorithms. LeetCode offers a myriad of challenges like this one, allowing programmers to enhance their problem-solving skills and gain confidence in tackling coding interviews. Remember, practice makes perfect!

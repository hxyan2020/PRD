# Codility Task 1: smallest positive integer not in array A
#
# Assumptions for local testing (test-input.txt):
# - One line of space-separated integers = array A
# - Running: python solution.py   (reads task1/test-input.txt from same folder)


def solution(A):
    # n is how many numbers are in the array
    n = len(A)

    # The answer is always between 1 and n + 1 (see problem pigeonhole idea)
    # flags[k] is True when positive integer k appears in A (only need 1..n)
    flags = []
    # Need indices 0..n+1 so we can check candidate values 1 through n+1
    index = 0
    while index <= n + 1:
        flags.append(False)
        index = index + 1

    # Mark which values from 1 to n are present in A
    for value in A:
        if value >= 1 and value <= n:
            flags[value] = True

    # First k with flags[k] == False is the missing smallest positive integer
    candidate = 1
    while candidate <= n + 1:
        if flags[candidate] is False:
            return candidate
        candidate = candidate + 1

    # Should not reach here; return 1 as safe fallback
    return 1


# --- Local test using test-input.txt (not used by Codility online judge) ---
if __name__ == "__main__":
    input_path = "test-input.txt"
    file_handle = open(input_path, "r")
    line = file_handle.readline()
    file_handle.close()

    # Split line into tokens and convert each to int
    parts = line.split()
    A = []
    for part in parts:
        A.append(int(part))

    result = solution(A)
    print(result)

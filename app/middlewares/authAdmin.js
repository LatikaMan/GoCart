const authAdmin = async (userId) => {
  try {
    if (!userId) return false;

    console.log("USER ID =", userId);
    console.log("ADMIN ID =", process.env.ADMIN_USER_ID);

    return userId === process.env.ADMIN_USER_ID;
  } catch (error) {
    console.log("Error in authAdmin middleware:", error);
    return false;
  }
};

export default authAdmin;
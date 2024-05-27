import { prismaclient } from "../../client/db";


class UserService{


public static followUser(from: string, to: string) {
    return prismaclient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
  }




public static unfollowUser(from: string, to: string) {
    return prismaclient.follows.delete({
      where: { followerId_followingId: { followerId: from, followingId: to } },
    });
  }
}

export default UserService;
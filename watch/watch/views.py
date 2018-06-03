# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render, HttpResponse
from django.templatetags.static import static
import tensorflow as tf
import numpy as np
from django.db import connection
from random import *
import json
import csv
import itertools
import pymysql
import os

def test(request) :
    tf.set_random_seed(777)
    training_set = np.loadtxt(static('csv\watch_recommand.csv'), delimiter=',', dtype=np.float32)
    x_set = training_set[:, 0:-1]
    y_set = training_set[:, [-1]]
    result = []
    member_no = request.POST.get('no')
    print(member_no)

    cursor = connection.cursor()
    try:
        #sql = "select * from member where member_no = " + member_no"
        sql_size = "select size,price,texture,kind from member"
        cursor.execute(sql_size)
        rows = cursor.fetchone()
        result = list(rows)
        print(result)

    except:
        print("error")

    finally:
        cursor.close()

    num = 6  # one-hot encoding
    x_num = 4  # number of interest
    y_num = 1  # result

    X = tf.placeholder(tf.float32, [None, x_num])
    Y = tf.placeholder(tf.int32, [None, y_num])

    # One-Hot encoding(0~num), reshape as a one-dimensional array
    Y_one_hot = tf.one_hot(Y, num)
    Y_one_hot = tf.reshape(Y_one_hot, [-1, num])

    W = tf.Variable(tf.random_normal([x_num, num]), name='weight')
    b = tf.Variable(tf.random_normal([num]), name='bias')

    # Calculate WX+b as the product of the matrix
    logits = tf.matmul(X, W) + b
    # Expressed as a probability value using softmax
    hypothesis = tf.nn.softmax(logits)

    # Cross entropy cost and minimize
    cost_i = tf.nn.softmax_cross_entropy_with_logits_v2(logits=logits, labels=Y_one_hot)
    cost = tf.reduce_mean(cost_i)
    optimizer = tf.train.GradientDescentOptimizer(learning_rate=0.1).minimize(cost)

    # Accuracy calculation
    prediction = tf.argmax(hypothesis, y_num)
    correct = tf.equal(prediction, tf.argmax(Y_one_hot, y_num))
    accuracy = tf.reduce_mean(tf.cast(correct, tf.float32))

    # launch graph
    with tf.Session() as sess:
        sess.run(tf.global_variables_initializer())

        # The process of machine learning
        for i in range(2001):
            sess.run(optimizer, feed_dict={X: x_set, Y: y_set})
            if i % 100 == 0:
                cost_loss, acc = sess.run([cost, accuracy], feed_dict={X: x_set, Y: y_set})
                print("step :{}, loss :{:.2f}, Acc :{:.1%}".format(i, cost_loss, acc))

        # Put input into the learned model
        select = sess.run(hypothesis, feed_dict={X: [result]})
        # Check the selected value through One-hot encoding
        arg = sess.run(tf.argmax(select, 1))
        print(select, arg)

        if arg == [0]:
            value = 0
        elif arg == [1]:
            value = 1
        elif arg == [2]:
            value = 2
        elif arg == [3]:
            value = 3
        elif arg == [4]:
            value = 4
        elif arg == [5]:
            value = 5

    #add
    searchDir = "C:\\basket\\basket\public\images\watch_pic\\" + str(value)
    file_list = os.listdir(searchDir)
    print(file_list)

    resultData = {'output': value, 'path':file_list}
    json_data = json.dumps(resultData)
    return HttpResponse(json_data,content_type="application/json")


# Create your views here.

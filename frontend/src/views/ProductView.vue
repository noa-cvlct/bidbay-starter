<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "../store/auth";

const { isAuthenticated, isAdmin, userData, token } = useAuthStore();

const route = useRoute();
const router = useRouter();

const productId = ref(route.params.productId);
const date = ref(new Date())

setInterval(() => date.value = new Date(), 1000)

function convertMS(ms) {
  let d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;

  let days = d > 0 ? d + 'j ' : ''
  let hours = h > 0 ? h + 'h ' : ''
  let minutes = m > 0 ? m + 'm ' : ''
  let seconds = s + 's'

  return days + hours + minutes + seconds
};

function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("fr-FR", options);
}

const product = ref(null);
const loading = ref(false);
const error = ref(false);
const offerInput = ref(null);

const hasEnded = computed(() => new Date(product.value.endDate) - date.value < 0)
const countdown = computed(() => hasEnded ? convertMS(new Date(product.value.endDate) - date.value) : 'Vente terminée')

const minimumBidPrice = computed(() => {
  if (product.value.bids.length > 0) {
    return product.value.bids.reduce((max, bid) => max.price > bid.price ? max : bid).price
  } else {
    return product.value.originalPrice
  }
})

async function fetchProduct() {
  loading.value = true;
  error.value = false;

  try {
    const response = await fetch(`http://localhost:3000/api/products/${productId.value}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const fetchedProduct = await response.json();
      product.value = fetchedProduct;
    } else {
      error.value = true;
    }
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function addBid() {
  loading.value = true;
  error.value = false;
  try {
    let response = await fetch(`http://localhost:3000/api/products/${productId.value}/bids`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        price: offerInput.value
      })
    })

    if (response.ok) {
      fetchProduct()
    } else {
      error.value = true
      if (response.status == "409") { // Conflict error
        fetchProduct()
      }
    }

  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

fetchProduct();

async function deleteProduct() {
  try {
    const response = await fetch(`http://localhost:3000/api/products/${productId.value}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token.value}`,
        accept: 'application/json'
      }
    });

    if (response.ok) {
      router.push({ name: 'Home' })
    } else {
      error.value = true;
    }
  } catch(e) {
    error.value = true;
  }
}

async function deleteBid(bidId) {
  try {
    const response = await fetch(`http://localhost:3000/api/bids/${bidId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token.value}`,
        accept: 'application/json'
      }
    });

    if (response.ok) {
      fetchProduct()
    } else {
      error.value = true;
    }
  } catch(e) {
    error.value = true;
  }
}

</script>

<template>
  <div class="row">
    <div v-if="loading" class="text-center mt-4" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger mt-4" role="alert" data-test-error>
      Une erreur est survenue lors du chargement des produits.
    </div>

    <div v-if="product != null" class="row" data-test-product>
      <!-- Colonne de gauche : image et compte à rebours -->
      <div class="col-lg-4">
        <img
          :src=product.pictureUrl
          :alt=product.name
          class="img-fluid rounded mb-3"
          data-test-product-picture
        />
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">Compte à rebours</h5>
          </div>
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted" data-test-countdown>
              Temps restant : {{ countdown }}
            </h6>
          </div>
        </div>
      </div>

      <!-- Colonne de droite : informations du produit et formulaire d'enchère -->
      <div class="col-lg-8">
        <div class="row">
          <div class="col-lg-6">
            <h1 class="mb-3" data-test-product-name>
              {{ product.name }}
            </h1>
          </div>
          <div v-if="isAuthenticated && (isAdmin || product.seller.id == userData.id)" class="col-lg-6 text-end">
            <RouterLink
              :to="{ name: 'ProductEdition', params: { productId: product.id } }"
              class="btn btn-primary"
              data-test-edit-product
            >
              Editer
            </RouterLink>
            &nbsp;
            <button @click="deleteProduct()" class="btn btn-danger" data-test-delete-product>
              Supprimer
            </button>
          </div>
        </div>

        <h2 class="mb-3">Description</h2>
        <p data-test-product-description>
          {{ product.description }}
        </p>

        <h2 class="mb-3">Informations sur l'enchère</h2>
        <ul>
          <li data-test-product-price>Prix de départ : {{ product.originalPrice }} €</li>
          <li data-test-product-end-date>Date de fin : {{ formatDate(product.endDate) }}</li>
          <li>
            Vendeur :
            <router-link
              :to="{ name: 'User', params: { userId: product.seller.id } }"
              data-test-product-seller
            >
              {{ product.seller.username }}
            </router-link>
          </li>
        </ul>

        <h2 class="mb-3">Offres sur le produit</h2>
        <table v-if="product.bids.length > 0" class="table table-striped" data-test-bids>
          <thead>
            <tr>
              <th scope="col">Enchérisseur</th>
              <th scope="col">Offre</th>
              <th scope="col">Date</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bid in product.bids" :key="bid.id" data-test-bid>
              <td>
                <router-link
                  :to="{ name: 'User', params: { userId: bid.bidder.id } }"
                  data-test-bid-bidder
                >
                  {{ bid.bidder.username }}
                </router-link>
              </td>
              <td data-test-bid-price>{{ bid.price }} €</td>
              <td data-test-bid-date>{{ formatDate(bid.date) }}</td>
              <td>
                <button
                  @click="deleteBid(bid.id)"
                  v-if="isAdmin || userData.id == bid.bidder.id"
                  class="btn btn-danger btn-sm"
                  data-test-delete-bid
                >
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else data-test-no-bids>Aucune offre pour le moment</p>

        <form
          @submit.prevent="addBid()"
          v-if="isAuthenticated && !hasEnded && userData.id != product.seller.id"
          data-test-bid-form
        >
          <div class="form-group">
            <label for="bidAmount">Votre offre :</label>
            <input
              v-model="offerInput"
              type="number"
              class="form-control"
              id="bidAmount"
              :min="minimumBidPrice"
              data-test-bid-form-price
            />
            <small class="form-text text-muted">
              Le montant doit être supérieur à {{ minimumBidPrice }} €.
            </small>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="offerInput <= minimumBidPrice"
            data-test-submit-bid
          >
            Enchérir
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
